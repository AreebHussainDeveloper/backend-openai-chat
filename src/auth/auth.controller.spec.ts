import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: vi.fn(),
    dashboardSignup: vi.fn(),
    login: vi.fn(),
    dashboardLogin: vi.fn(),
    dashboardRefreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    dashboardForgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    dashboardResetPassword: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
