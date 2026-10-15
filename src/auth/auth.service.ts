import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ErrorCodes } from '../common/constants/error-codes.enum.js';
import { ErrorMessages } from '../common/constants/error-messages.js';
import { SuccessCodes } from '../common/constants/success-codes.enum.js';
import { SuccessMessages } from '../common/constants/success-messages.js';
import { User, UserRole } from '../users/user.entity.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { AppMailService } from '../mail/mail.service.js';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: AppMailService,
    private readonly configService: ConfigService,
  ) {}

  private toPublicUser(user: User) {
    const {
      password,
      resetTokenHash,
      resetTokenExpiresAt,
      refreshTokenHash,
      refreshTokenExpiresAt,
      ...safeUser
    } = user;
    return safeUser;
  }

  private async findUserForAuth(email: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.resetTokenHash')
      .addSelect('user.resetTokenExpiresAt')
      .addSelect('user.refreshTokenHash')
      .addSelect('user.refreshTokenExpiresAt')
      .where('user.email = :email', { email })
      .getOne();
  }

  private async signTokenPair(user: User) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      { expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.userRepository.save(user);

    return { accessToken, refreshToken };
  }

  async signup(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException(
        ErrorMessages[ErrorCodes.EMAIL_ALREADY_IN_USE],
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = this.userRepository.create({
        email,
        fullName: dto.fullName.trim(),
        password: hashedPassword,
        role: UserRole.USER,
      });

      const savedUser = await this.userRepository.save(user);
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        savedUser.password,
      );
      const tokens = await this.signTokenPair(savedUser);
      await this.mailService.sendWelcome({
        to: savedUser.email,
        name: savedUser.fullName,
        email: savedUser.email,
        loginUrl: `${this.configService.get<string>('FRONTEND_URL')}/auth/login`,
        password: isPasswordValid ? dto.password : undefined, // Don't send the user's password by email
      });
      return {
        user: this.toPublicUser(savedUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new BadRequestException(
          ErrorMessages[ErrorCodes.EMAIL_ALREADY_IN_USE],
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.findUserForAuth(email);

    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_EMAIL_AND_PASSWORD],
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_EMAIL_AND_PASSWORD],
      );
    }

    const tokens = await this.signTokenPair(user);

    return {
      user: this.toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync(dto.refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        refreshTokenHash: true,
        refreshTokenExpiresAt: true,
      },
    });

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.signTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Throw error if email does not exist
    if (!user) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.USER_DOESNOT_EXIT] );
    }

    const resetToken = randomBytes(32).toString('hex');

    user.resetTokenHash = await bcrypt.hash(resetToken, 10);
    user.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.userRepository.save(user);

    const frontendUrl = this.configService
      .get<string>('FRONTEND_URL')
      ?.replace(/\/+$/, '');

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured');
    }

    const verificationLink = `${frontendUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.mailService.resetPassword({
      to: user.email,
      email: user.email,
      verificationLink,
    });

    return {
      message: SuccessMessages[SuccessCodes.PASSWORD_RESET_EMAIL_SENT],
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.resetTokenHash')
      .addSelect('user.resetTokenExpiresAt')
      .addSelect('user.refreshTokenHash')
      .addSelect('user.refreshTokenExpiresAt')
      .getMany();

    const matchedUser = await users.reduce<Promise<User | null>>(
      async (acc, candidate) => {
        const current = await acc;

        if (current) {
          return current;
        }

        if (!candidate.resetTokenHash || !candidate.resetTokenExpiresAt) {
          return null;
        }

        if (candidate.resetTokenExpiresAt.getTime() <= Date.now()) {
          return null;
        }

        const tokenMatches = await bcrypt.compare(
          dto.resetToken,
          candidate.resetTokenHash,
        );

        return tokenMatches ? candidate : null;
      },
      Promise.resolve(null),
    );

    if (!matchedUser) {
      throw new BadRequestException(
        ErrorMessages[ErrorCodes.INVALID_OR_EXPIRED_TOKEN],
      );
    }

    matchedUser.password = await bcrypt.hash(dto.newPassword, 10);
    matchedUser.resetTokenHash = null;
    matchedUser.resetTokenExpiresAt = null;
    await this.userRepository.save(matchedUser);

    return {
      message: SuccessMessages[SuccessCodes.PASSWORD_RESET_SUCCESS],
    };
  }
}
