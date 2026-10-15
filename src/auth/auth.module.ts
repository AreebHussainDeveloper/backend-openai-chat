import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MailModule } from '../mail/mail.module.js';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1h' },
    }),
    MailModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [
    JwtModule,
    // Keep your existing exports
  ],
})
export class AuthModule {}
