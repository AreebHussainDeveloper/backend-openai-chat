import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AppMailService } from '../mail/mail.service.js';
import { AuthService } from './auth.service.js';
import { User } from '../users/user.entity.js';
import { DashboardUser } from './entities/dashboard-user.entity.js';

vi.mock('bcrypt', () => {
  const compare = vi.fn();
  const hash = vi.fn();

  return {
    __esModule: true,
    default: { compare, hash },
    compare,
    hash,
  };
});

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    createQueryBuilder: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const mockDashboardUserRepository = {
    findOne: vi.fn(),
    find: vi.fn(),
    createQueryBuilder: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const mockQueryBuilder = {
    addSelect: vi.fn(),
    where: vi.fn(),
    getOne: vi.fn(),
  };
  const mockDashboardQueryBuilder = {
    addSelect: vi.fn(),
    where: vi.fn(),
    getOne: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('signed-token'),
    verifyAsync: vi.fn(),
  };
  const mockMailService = {
    sendWelcome: vi.fn(),
    resetPassword: vi.fn(),
  };
  const mockConfigService = {
    get: vi.fn().mockReturnValue('https://example.com'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(DashboardUser),
          useValue: mockDashboardUserRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AppMailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
    mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockDashboardUserRepository.createQueryBuilder.mockReturnValue(
      mockDashboardQueryBuilder,
    );
    mockQueryBuilder.addSelect.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
    mockDashboardQueryBuilder.addSelect.mockReturnThis();
    mockDashboardQueryBuilder.where.mockReturnThis();
  });

  it('should sign up a user and return a token', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed',
      role: 'CUSTOMER',
    });
    mockUserRepository.save.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed',
      role: 'CUSTOMER',
    });

    const result = await service.signup({
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user).not.toHaveProperty('refreshTokenHash');
    expect(result.user).not.toHaveProperty('refreshTokenExpiresAt');
  });

  it('should allow a user to log in', async () => {
    mockQueryBuilder.getOne.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed-password',
      role: 'CUSTOMER',
    });

    const bcrypt = await import('bcrypt');
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.hash as any).mockResolvedValue('hashed-password');

    const result = await service.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('should allow a customer and dashboard account to share an email', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      id: 1,
      email: 'shared@example.com',
      fullName: 'Shared User',
      password: 'hashed',
      role: 'CUSTOMER',
    });
    mockUserRepository.save.mockImplementation(async (account) => account);

    mockDashboardUserRepository.findOne.mockResolvedValue(null);
    mockDashboardUserRepository.create.mockReturnValue({
      id: 2,
      email: 'shared@example.com',
      fullName: 'Shared User',
      password: 'hashed',
      role: 'STAFF',
    });
    mockDashboardUserRepository.save.mockImplementation(
      async (account) => account,
    );

    await service.signup({
      email: 'shared@example.com',
      fullName: 'Shared User',
      password: 'Password123!',
    });
    await service.dashboardSignup({
      email: 'shared@example.com',
      fullName: 'Shared User',
      password: 'Password123!',
    });

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'CUSTOMER' }),
    );
    expect(mockDashboardUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'STAFF' }),
    );
    expect(mockMailService.sendWelcome).toHaveBeenCalledWith(
      expect.objectContaining({
        loginUrl: 'https://example.com/dashboard/login',
      }),
    );
  });

  it('should reject customer accounts on dashboard login', async () => {
    mockDashboardQueryBuilder.getOne.mockResolvedValue(null);

    await expect(
      service.dashboardLogin({
        email: 'customer@example.com',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should authenticate dashboard accounts from the dashboard table', async () => {
    mockDashboardQueryBuilder.getOne.mockResolvedValue({
      id: 2,
      email: 'shared@example.com',
      fullName: 'Dashboard User',
      password: 'hashed-password',
      role: 'STAFF',
    });
    mockDashboardUserRepository.save.mockImplementation(
      async (account) => account,
    );

    const bcrypt = await import('bcrypt');
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.hash as any).mockResolvedValue('refresh-token-hash');

    const result = await service.dashboardLogin({
      email: 'shared@example.com',
      password: 'Password123!',
    });

    expect(result.user.email).toBe('shared@example.com');
    expect(mockDashboardQueryBuilder.getOne).toHaveBeenCalled();
    expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
  });

  it('should rotate a valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 1, type: 'refresh' });
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      role: 'CUSTOMER',
      refreshTokenHash: 'stored-refresh-token-hash',
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const bcrypt = await import('bcrypt');
    (bcrypt.compare as any).mockResolvedValue(true);
    (bcrypt.hash as any).mockResolvedValue('new-refresh-token-hash');
    mockUserRepository.save.mockImplementation(async (user) => user);

    const result = await service.refreshToken({ refreshToken });

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      select: {
        id: true,
        refreshTokenHash: true,
        refreshTokenExpiresAt: true,
      },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      refreshToken,
      'stored-refresh-token-hash',
    );
    expect(result).toEqual({
      accessToken: 'signed-token',
      refreshToken: 'signed-token',
    });
  });
});
