import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogoutAuthGuard } from './logout-auth.guard';

describe('LogoutAuthGuard', () => {
  const authTokenService = {
    verify: vi.fn(),
  };
  const prisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  const guard = new LogoutAuthGuard(authTokenService, prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows invalid tokens without attaching an authenticated user', async () => {
    authTokenService.verify.mockImplementation(() => {
      throw new Error('expired');
    });
    const request = {
      headers: {
        cookie: 'bidplace_session=expired-token',
      },
    };

    const result = await guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    });

    expect(result).toBe(true);
    expect(request).not.toHaveProperty('auth');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows stale sessions without attaching an authenticated user', async () => {
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
    const request = {
      headers: {
        cookie: 'bidplace_session=stale-token',
      },
    };

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      }),
    ).resolves.toBe(true);

    expect(request).not.toHaveProperty('auth');
  });

  it('attaches a user only for a valid current session', async () => {
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
        cookie: 'bidplace_session=current-token',
      },
    };

    await guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    });

    expect(request).toMatchObject({
      auth: {
        sub: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      },
    });
  });
});
