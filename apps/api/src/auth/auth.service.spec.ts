import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authCredentialsSelect, authUserContractSelect } from './auth.mapper';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { PasswordHasherService } from './password-hasher.service';
import { type AuthRepository } from './auth.service';

type PrismaUser = {
  id: string;
  email: string;
  passwordHash: string;
  phone: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

function createPrismaUser(overrides: Partial<PrismaUser> = {}): PrismaUser {
  return {
    id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    email: 'seller@example.com',
    passwordHash: 'hashed-password',
    phone: '+15555550123',
    displayName: 'Demo Seller',
    role: 'user',
    status: 'active',
    sessionVersion: 0,
    createdAt: new Date('2026-07-13T12:00:00.000Z'),
    updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  const prisma = {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  } satisfies AuthRepository;

  const passwordHasher = {
    hash: vi.fn(),
    verify: vi.fn(),
  } satisfies Pick<PasswordHasherService, 'hash' | 'verify'>;

  const authTokenService = {
    sign: vi.fn(),
    verify: vi.fn(),
  } satisfies Pick<AuthTokenService, 'sign' | 'verify'>;

  const service = new AuthService(
    prisma,
    passwordHasher,
    authTokenService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user with a hashed password', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(
      createPrismaUser({
        email: 'new-seller@example.com',
        passwordHash: 'hashed-value',
      }),
    );
    passwordHasher.hash.mockResolvedValue('hashed-value');
    authTokenService.sign.mockReturnValue('signed-token');

    const result = await service.register({
      email: 'New-Seller@Example.com',
      password: 'super-secret',
      phone: '+15555550123',
      displayName: 'Demo Seller',
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new-seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        passwordHash: 'hashed-value',
        status: 'active',
        sessionVersion: 0,
      },
      select: authCredentialsSelect,
    });
    expect(authTokenService.sign).toHaveBeenCalledWith({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'new-seller@example.com',
      role: 'user',
      sessionVersion: 0,
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'new-seller@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });
  });

  it('rejects duplicate email or phone on registration', async () => {
    prisma.user.findFirst.mockResolvedValue(createPrismaUser());

    await expect(
      service.register({
        email: 'seller@example.com',
        password: 'super-secret',
        phone: '+15555550123',
        displayName: 'Demo Seller',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'super-secret',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logs a user in with a valid password', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createPrismaUser({
        email: 'login@example.com',
        passwordHash: 'hashed-login-password',
      }),
    );
    passwordHasher.verify.mockResolvedValue(true);
    authTokenService.sign.mockReturnValue('signed-token');

    const result = await service.login({
      email: 'Login@Example.com',
      password: 'super-secret',
    });

    expect(passwordHasher.verify).toHaveBeenCalledWith(
      'hashed-login-password',
      'super-secret',
    );
    expect(authTokenService.sign).toHaveBeenCalledWith({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'login@example.com',
      role: 'user',
      sessionVersion: 0,
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        email: 'login@example.com',
        phone: '+15555550123',
        displayName: 'Demo Seller',
        role: 'user',
        status: 'active',
        createdAt: '2026-07-13T12:00:00.000Z',
        updatedAt: '2026-07-13T12:00:00.000Z',
      },
    });
  });

  it('returns the current user from me', async () => {
    prisma.user.findUnique.mockResolvedValue(createPrismaUser());

    const result = await service.me(
      '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
    );

    expect(result).toEqual({
      id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      phone: '+15555550123',
      displayName: 'Demo Seller',
      role: 'user',
      status: 'active',
      createdAt: '2026-07-13T12:00:00.000Z',
      updatedAt: '2026-07-13T12:00:00.000Z',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      select: authUserContractSelect,
    });
  });

  it('rejects banned users on login', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createPrismaUser({
        email: 'banned@example.com',
        status: 'banned',
      }),
    );

    await expect(
      service.login({
        email: 'banned@example.com',
        password: 'super-secret',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('invalidates existing sessions on logout', async () => {
    prisma.user.update.mockResolvedValue({});

    await service.logout('2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: {
        id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    });
  });
});
