import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ErrorCodes } from '../../common/constants/error-codes.enum.js';
import { ErrorMessages } from '../../common/constants/error-messages.js';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  type: string;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid bearer token',
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch {
      throw new UnauthorizedException(
        ErrorMessages[ErrorCodes.INVALID_OR_EXPIRED_TOKEN],
      );
    }
  }
}