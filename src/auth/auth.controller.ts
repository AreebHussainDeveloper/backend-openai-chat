import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AUTH_API_OPTIONS,
  AUTH_API_PREFIX,
  AUTH_API_TAG,
} from './auth-api-options.constants.js';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@ApiTags(AUTH_API_TAG)
@Controller(AUTH_API_PREFIX)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AUTH_API_OPTIONS.signup.path)
  @ApiOperation(AUTH_API_OPTIONS.signup.operation)
  signup(@Body() dto: RegisterDto) {
    return this.authService.signup(dto);
  }

  @Post(AUTH_API_OPTIONS.dashboardSignup.path)
  @ApiOperation(AUTH_API_OPTIONS.dashboardSignup.operation)
  dashboardSignup(@Body() dto: RegisterDto) {
    return this.authService.dashboardSignup(dto);
  }

  @Post(AUTH_API_OPTIONS.login.path)
  @ApiOperation(AUTH_API_OPTIONS.login.operation)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post(AUTH_API_OPTIONS.dashboardLogin.path)
  @ApiOperation(AUTH_API_OPTIONS.dashboardLogin.operation)
  dashboardLogin(@Body() dto: LoginDto) {
    return this.authService.dashboardLogin(dto);
  }

  @Post(AUTH_API_OPTIONS.refresh.path)
  @ApiOperation(AUTH_API_OPTIONS.refresh.operation)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post(AUTH_API_OPTIONS.dashboardRefresh.path)
  @ApiOperation(AUTH_API_OPTIONS.dashboardRefresh.operation)
  dashboardRefresh(@Body() dto: RefreshTokenDto) {
    return this.authService.dashboardRefreshToken(dto);
  }

  @Post(AUTH_API_OPTIONS.forgotPassword.path)
  @ApiOperation(AUTH_API_OPTIONS.forgotPassword.operation)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post(AUTH_API_OPTIONS.dashboardForgotPassword.path)
  @ApiOperation(AUTH_API_OPTIONS.dashboardForgotPassword.operation)
  dashboardForgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.dashboardForgotPassword(dto);
  }

  @Post(AUTH_API_OPTIONS.resetPassword.path)
  @ApiOperation(AUTH_API_OPTIONS.resetPassword.operation)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post(AUTH_API_OPTIONS.dashboardResetPassword.path)
  @ApiOperation(AUTH_API_OPTIONS.dashboardResetPassword.operation)
  dashboardResetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.dashboardResetPassword(dto);
  }
}
