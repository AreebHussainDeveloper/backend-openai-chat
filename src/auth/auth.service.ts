import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { In, QueryFailedError, Repository } from 'typeorm';
import { ErrorCodes } from '../common/constants/error-codes.enum.js';
import { ErrorMessages } from '../common/constants/error-messages.js';
import { SuccessCodes } from '../common/constants/success-codes.enum.js';
import { SuccessMessages } from '../common/constants/success-messages.js';
import { AppMailService } from '../mail/mail.service.js';
import { User } from '../users/user.entity.js';
import { DashboardUser } from './entities/dashboard-user.entity.js';
import { DashboardRole } from './enums/dashboard-role.enum.js';
import { UserRole } from './enums/roles.enum.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

export interface AuthAccount {
  id: number;
  email: string;
  fullName: string;
  password: string;
  role: UserRole | DashboardRole;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  refreshTokenHash: string | null;
  refreshTokenExpiresAt: Date | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DashboardUser)
    private readonly dashboardUserRepository: Repository<DashboardUser>,
    private readonly jwtService: JwtService,
    private readonly mailService: AppMailService,
    private readonly configService: ConfigService,
  ) {}

  private toPublicAccount<T extends AuthAccount>(account: T) {
    const {
      password: _password,
      resetTokenHash: _resetTokenHash,
      resetTokenExpiresAt: _resetTokenExpiresAt,
      refreshTokenHash: _refreshTokenHash,
      refreshTokenExpiresAt: _refreshTokenExpiresAt,
      ...safeAccount
    } = account;
    return safeAccount;
  }

  private async findAccountForAuth<T extends AuthAccount>(
    email: string,
    repository: Repository<T>,
  ) {
    return repository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .addSelect('account.resetTokenHash')
      .addSelect('account.resetTokenExpiresAt')
      .addSelect('account.refreshTokenHash')
      .addSelect('account.refreshTokenExpiresAt')
      .where('account.email = :email', { email })
      .getOne();
  }

  private async signTokenPair<T extends AuthAccount>(
    account: T,
    saveAccount: (account: T) => Promise<unknown>,
  ) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: account.id,
        email: account.email,
        role: account.role,
        type: 'access',
      },
      { expiresIn: '1h' },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: account.id,
        email: account.email,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    account.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    account.refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    );
    await saveAccount(account);

    return { accessToken, refreshToken };
  }

  async signup(dto: RegisterDto) {
    return this.signupWithRole(
      dto,
      '/auth/login',
      (email) => this.userRepository.findOne({ where: { email } }),
      (email, fullName, password) =>
        this.userRepository.create({
          email,
          fullName,
          password,
          role: UserRole.CUSTOMER,
        }),
      (account) => this.userRepository.save(account),
      (account) =>
        this.signTokenPair(account, (value) =>
          this.userRepository.save(value),
        ),
    );
  }

  async dashboardSignup(dto: RegisterDto) {
    return this.signupWithRole(
      dto,
      '/dashboard/login',
      (email) => this.dashboardUserRepository.findOne({ where: { email } }),
      (email, fullName, password) =>
        this.dashboardUserRepository.create({
          email,
          fullName,
          password,
          role: DashboardRole.STAFF,
        }),
      (account) => this.dashboardUserRepository.save(account),
      (account) =>
        this.signTokenPair(account, (value) =>
          this.dashboardUserRepository.save(value),
        ),
    );
  }

  private async signupWithRole<T extends AuthAccount>(
    dto: RegisterDto,
    loginPath: string,
    findExisting: (email: string) => Promise<T | null>,
    createAccount: (email: string, fullName: string, password: string) => T,
    saveAccount: (account: T) => Promise<T>,
    signTokens: (
      account: T,
    ) => Promise<{ accessToken: string; refreshToken: string }>,
  ) {
    const email = dto.email.trim().toLowerCase();
    const existingAccount = await findExisting(email);

    if (existingAccount) {
      throw new BadRequestException(
        ErrorMessages[ErrorCodes.EMAIL_ALREADY_IN_USE],
      );
    }

    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const account = createAccount(
        email,
        dto.fullName.trim(),
        hashedPassword,
      );

      const savedAccount = await saveAccount(account);
      const tokens = await signTokens(savedAccount);
      await this.mailService.sendWelcome({
        to: savedAccount.email,
        name: savedAccount.fullName,
        email: savedAccount.email,
        loginUrl: `${this.configService.get<string>('FRONTEND_URL')}${loginPath}`,
      });

      return {
        user: this.toPublicAccount(savedAccount),
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
    return this.loginWithRoles(
      dto,
      this.userRepository,
      [UserRole.CUSTOMER],
    );
  }

  async dashboardLogin(dto: LoginDto) {
    return this.loginWithRoles(dto, this.dashboardUserRepository, [
      DashboardRole.ADMIN,
      DashboardRole.STAFF,
    ]);
  }

  private async loginWithRoles<T extends AuthAccount>(
    dto: LoginDto,
    repository: Repository<T>,
    allowedRoles: T['role'][],
  ) {
    const email = dto.email.trim().toLowerCase();
    const account = await this.findAccountForAuth(email, repository);

    if (!account || !allowedRoles.includes(account.role)) {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_EMAIL_AND_PASSWORD],
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, account.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_EMAIL_AND_PASSWORD],
      );
    }

    const tokens = await this.signTokenPair(account, (value) =>
      repository.save(value),
    );

    return {
      user: this.toPublicAccount(account),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    return this.refreshAccountToken(
      dto,
      (id) =>
        this.userRepository.findOne({
          where: { id },
          select: {
            id: true,
            refreshTokenHash: true,
            refreshTokenExpiresAt: true,
          },
        }),
      (account) =>
        this.signTokenPair(account, (value) =>
          this.userRepository.save(value),
        ),
    );
  }

  async dashboardRefreshToken(dto: RefreshTokenDto) {
    return this.refreshAccountToken(
      dto,
      (id) =>
        this.dashboardUserRepository.findOne({
          where: { id },
          select: {
            id: true,
            refreshTokenHash: true,
            refreshTokenExpiresAt: true,
          },
        }),
      (account) =>
        this.signTokenPair(account, (value) =>
          this.dashboardUserRepository.save(value),
        ),
    );
  }

  private async refreshAccountToken<T extends AuthAccount>(
    dto: RefreshTokenDto,
    findById: (id: number) => Promise<T | null>,
    signTokens: (
      account: T,
    ) => Promise<{ accessToken: string; refreshToken: string }>,
  ) {
    const payload = await this.jwtService.verifyAsync(dto.refreshToken);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const account = await findById(Number(payload.sub));

    if (
      !account ||
      !account.refreshTokenHash ||
      !account.refreshTokenExpiresAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      dto.refreshToken,
      account.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (account.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    return signTokens(account);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.requestPasswordReset(
      dto,
      '/auth/reset-password',
      (email) =>
        this.userRepository.findOne({
          where: { email, role: In([UserRole.CUSTOMER]) },
        }),
      (account) => this.userRepository.save(account),
    );
  }

  async dashboardForgotPassword(dto: ForgotPasswordDto) {
    return this.requestPasswordReset(
      dto,
      '/dashboard/reset-password',
      (email) =>
        this.dashboardUserRepository.findOne({
          where: {
            email,
            role: In([DashboardRole.ADMIN, DashboardRole.STAFF]),
          },
        }),
      (account) => this.dashboardUserRepository.save(account),
    );
  }

  private async requestPasswordReset<T extends AuthAccount>(
    dto: ForgotPasswordDto,
    resetPath: string,
    findAccount: (email: string) => Promise<T | null>,
    saveAccount: (account: T) => Promise<T>,
  ) {
    const email = dto.email.trim().toLowerCase();
    const account = await findAccount(email);

    if (!account) {
      throw new NotFoundException(ErrorMessages[ErrorCodes.USER_DOESNOT_EXIT]);
    }

    const resetToken = randomBytes(32).toString('hex');
    account.resetTokenHash = await bcrypt.hash(resetToken, 10);
    account.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await saveAccount(account);

    const frontendUrl = this.configService
      .get<string>('FRONTEND_URL')
      ?.replace(/\/+$/, '');

    if (!frontendUrl) {
      throw new Error(
        ErrorMessages[ErrorCodes.FRONTEND_URL_NOT_CONFIGURED],
      );
    }

    const verificationLink = `${frontendUrl}${resetPath}?token=${encodeURIComponent(resetToken)}`;

    await this.mailService.resetPassword({
      to: account.email,
      email: account.email,
      verificationLink,
    });

    return {
      message: SuccessMessages[SuccessCodes.PASSWORD_RESET_EMAIL_SENT],
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForRoles(
      dto,
      [UserRole.CUSTOMER],
      this.userRepository,
    );
  }

  async dashboardResetPassword(dto: ResetPasswordDto) {
    return this.resetPasswordForRoles(
      dto,
      [DashboardRole.ADMIN, DashboardRole.STAFF],
      this.dashboardUserRepository,
    );
  }

  private async resetPasswordForRoles<T extends AuthAccount>(
    dto: ResetPasswordDto,
    allowedRoles: T['role'][],
    repository: Repository<T>,
  ) {
    const accounts = await repository
      .createQueryBuilder('account')
      .addSelect('account.password')
      .addSelect('account.resetTokenHash')
      .addSelect('account.resetTokenExpiresAt')
      .addSelect('account.refreshTokenHash')
      .addSelect('account.refreshTokenExpiresAt')
      .where('account.role IN (:...roles)', { roles: allowedRoles })
      .getMany();

    const matchedAccount = await accounts.reduce<Promise<T | null>>(
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

    if (!matchedAccount) {
      throw new BadRequestException(
        ErrorMessages[ErrorCodes.INVALID_OR_EXPIRED_TOKEN],
      );
    }

    matchedAccount.password = await bcrypt.hash(dto.newPassword, 10);
    matchedAccount.resetTokenHash = null;
    matchedAccount.resetTokenExpiresAt = null;
    await repository.save(matchedAccount);

    return {
      message: SuccessMessages[SuccessCodes.PASSWORD_RESET_SUCCESS],
    };
  }
}
