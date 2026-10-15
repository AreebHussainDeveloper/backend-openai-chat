import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtStrategy {
  constructor(private readonly jwtService: JwtService) {}

  async validate(token: string) {
    const payload = await this.jwtService.verifyAsync(token);

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}