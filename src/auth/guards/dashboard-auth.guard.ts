import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ErrorCodes } from '../../common/constants/error-codes.enum.js';
import { ErrorMessages } from '../../common/constants/error-messages.js';
import { DashboardUser } from '../entities/dashboard-user.entity.js';
import { DashboardRole } from '../enums/dashboard-role.enum.js';

interface DashboardJwtPayload {
  sub: number;
  email: string;
  role: DashboardRole;
  type: string;
}

interface DashboardAuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: DashboardRole;
  };
}

@Injectable()
export class DashboardAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(DashboardUser)
    private readonly dashboardUserRepository: Repository<DashboardUser>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<DashboardAuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid bearer token');
    }

    let payload: DashboardJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<DashboardJwtPayload>(
        authHeader.slice(7),
      );
    } catch {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_OR_EXPIRED_TOKEN],
      );
    }

    if (
      payload.type !== 'access' ||
      !Number.isInteger(payload.sub) ||
      !payload.email ||
      !Object.values(DashboardRole).includes(payload.role)
    ) {
      throw new UnauthorizedException('Invalid dashboard access token');
    }

    const dashboardUser = await this.dashboardUserRepository.findOne({
      where: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!dashboardUser) {
      throw new UnauthorizedException('Dashboard account not found');
    }

    request.user = {
      id: dashboardUser.id,
      email: dashboardUser.email,
      role: dashboardUser.role,
    };

    return true;
  }
}
