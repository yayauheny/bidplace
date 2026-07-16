import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BearerAuthGuard } from './bearer-auth.guard';
import { InvalidPersistenceValueError } from '../core/contracts';

describe('BearerAuthGuard', () => {
  const authTokenService = {
    verify: vi.fn(),
  };
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  const guard = new BearerAuthGuard(authTokenService, prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates requests with a session cookie', async () => {
    authTokenService.verify.mockReturnValue({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      role: 'user',
      sessionVersion: 2,
      iat: 1,
      exp: 2_000_000_000,
    });
    prisma.user.findUnique.mockResolvedValue({
      status: 'active',
      sessionVersion: 2,
    });

    const request = {
      headers: {
        cookie: 'bidplace_session=session-cookie-token',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } satisfies Parameters<BearerAuthGuard['canActivate']>[0];

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request).toMatchObject({
      auth: {
        sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    });
  });

  it('rejects tokens with stale session versions', async () => {
    authTokenService.verify.mockReturnValue({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      role: 'user',
      sessionVersion: 1,
      iat: 1,
      exp: 2_000_000_000,
    });
    prisma.user.findUnique.mockResolvedValue({
      status: 'active',
      sessionVersion: 2,
    });

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              cookie: 'bidplace_session=session-cookie-token',
            },
          }),
        }),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('propagates invalid persistence user status values', async () => {
    authTokenService.verify.mockReturnValue({
      sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      email: 'seller@example.com',
      role: 'user',
      sessionVersion: 2,
      iat: 1,
      exp: 2_000_000_000,
    });
    prisma.user.findUnique.mockResolvedValue({
      status: 'corrupted',
      sessionVersion: 2,
    });

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              cookie: 'bidplace_session=session-cookie-token',
            },
          }),
        }),
      }),
    ).rejects.toBeInstanceOf(InvalidPersistenceValueError);
  });
});
