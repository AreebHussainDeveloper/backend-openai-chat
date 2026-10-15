import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service.js';
import { User } from '../users/user.entity.js';

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

  const mockQueryBuilder = {
    addSelect: vi.fn(),
    where: vi.fn(),
    getOne: vi.fn(),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('signed-token'),
    verifyAsync: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
    mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.addSelect.mockReturnThis();
    mockQueryBuilder.where.mockReturnThis();
  });

  it('should sign up a user and return a token', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    mockUserRepository.create.mockReturnValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed',
      role: 'USER',
    });
    mockUserRepository.save.mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      password: 'hashed',
      role: 'USER',
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
      role: 'USER',
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

  it('should rotate a valid refresh token', async () => {
    const refreshToken = 'valid-refresh-token';
    mockJwtService.verifyAsync.mockResolvedValue({ sub: 1, type: 'refresh' });
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      role: 'USER',
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
