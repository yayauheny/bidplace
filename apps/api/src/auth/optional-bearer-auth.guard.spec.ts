import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OptionalBearerAuthGuard } from './optional-bearer-auth.guard';

describe('OptionalBearerAuthGuard', () => {
  const authTokenService = { verify: vi.fn() };
  const prisma = { user: { findUnique: vi.fn() } };
  const guard = new OptionalBearerAuthGuard(authTokenService, prisma);

  beforeEach(() => {
    vi.resetAllMocks();
    authTokenService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
  });

  it('allows an anonymous request without reading a user', async () => {
    const request = { headers: { cookie: 'unrelated=%broken' } };

    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }),
    ).resolves.toBe(true);

    expect(request).not.toHaveProperty('auth');
    expect(authTokenService.verify).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'wrong Authorization scheme', headers: { authorization: 'Basic invalid' } },
    { name: 'missing bearer value', headers: { authorization: 'Bearer' } },
    { name: 'extra bearer value', headers: { authorization: 'Bearer invalid extra' } },
    { name: 'malformed cookie encoding', headers: { cookie: 'bidplace_session=%E0%A4%A' } },
    { name: 'empty session cookie', headers: { cookie: 'bidplace_session=' } },
  ])('rejects $name with 401 before reading a user', async ({ headers }) => {
    const request = { headers };

    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(request).not.toHaveProperty('auth');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('attaches the current persisted role for a valid session', async () => {
    authTokenService.verify.mockReturnValue({ sub: 'user-id', role: 'admin', sessionVersion: 2 });
    prisma.user.findUnique.mockResolvedValue({ role: 'user', status: 'active', sessionVersion: 2 });
    const request = { headers: { cookie: 'bidplace_session=unit-session' } };

    await expect(
      guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }),
    ).resolves.toBe(true);

    expect(request).toMatchObject({ auth: { sub: 'user-id', role: 'user' } });
  });

  it('propagates a database failure instead of treating it as an anonymous request', async () => {
    authTokenService.verify.mockReturnValue({ sub: 'user-id', sessionVersion: 2 });
    const failure = new Error('Database unavailable');
    prisma.user.findUnique.mockRejectedValue(failure);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => ({ headers: { cookie: 'bidplace_session=unit-session' } }) }),
      }),
    ).rejects.toBe(failure);
  });
});
