import { afterEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { SessionService, type SessionRequest } from './session.service';
import { SessionAuthGuard } from './session-auth.guard';
import { OptionalSessionAuthGuard } from './optional-session-auth.guard';
import { LogoutAuthGuard } from './logout-auth.guard';

const services: SessionService[] = [];
afterEach(async () => {
  await Promise.all(
    services.splice(0).map((service) => service.onModuleDestroy()),
  );
});

function fixture(overrides: Record<string, unknown> = {}) {
  const user = {
    id: 'ff18fe81-4bd3-4659-9d10-8dcb71c54ee7',
    email: 'session@example.test',
    role: 'user',
    status: 'active',
    sessionVersion: 2,
    ...overrides,
  };
  const prisma = {
    authFlow: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    user: { findUnique: vi.fn().mockResolvedValue(user) },
  };
  const service = new SessionService(syntheticServerEnv(), prisma as never);
  services.push(service);
  const request = {
    headers: {},
    sessionID: 'synthetic-session-id',
    session: {
      principal: {
        userId: user.id,
        version: 2,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 100_000,
      },
    },
  } as SessionRequest;
  return { service, request, prisma, user };
}

describe('server session authentication', () => {
  it('uses current database role rather than a persisted role', async () => {
    const { service, request } = fixture({ role: 'admin' });
    await expect(service.authenticate(request)).resolves.toBe(true);
    expect(request.auth).toMatchObject({ role: 'admin', sessionVersion: 2 });
  });

  it.each([{ status: 'banned' }, { sessionVersion: 3 }])(
    'rejects a revoked or banned session: %j',
    async (overrides) => {
      const { service, request } = fixture(overrides);
      await expect(service.authenticate(request)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    },
  );

  it('enforces absolute expiry even if the store row was touched', async () => {
    const { service, request, prisma } = fixture();
    request.session.principal!.expiresAt = Date.now() - 1;
    await expect(service.authenticate(request)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('keeps anonymous public reads but rejects supplied invalid credentials', async () => {
    const { service, request } = fixture();
    delete request.session.principal;
    await expect(service.authenticate(request, true)).resolves.toBe(true);
    request.headers.cookie = 'bidplace_session=invalid';
    await expect(service.authenticate(request, true)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    request.headers.cookie = 'bidplace_session=%E0%A4%A';
    await expect(service.authenticate(request, true)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    request.headers.cookie = undefined;
    request.headers.authorization = 'Bearer legacy';
    await expect(service.authenticate(request, true)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('does not authenticate pending onboarding', async () => {
    const { service, request } = fixture();
    delete request.session.principal;
    request.session.flowId = 'pending';
    await expect(service.authenticate(request, true)).resolves.toBe(true);
    await expect(service.authenticate(request)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rotates before saving and removes authentication on save failure', async () => {
    const { service, request } = fixture();
    vi.spyOn(service, 'withLease').mockImplementation(
      async (_request, operation) => operation(),
    );
    const order: string[] = [];
    request.session.regenerate = vi.fn((callback) => {
      order.push('rotate');
      callback(undefined);
      return request.session;
    });
    request.session.save = vi.fn((callback) => {
      order.push('save');
      callback?.(new Error('offline'));
      return request.session;
    });
    await expect(service.login(request, 'user', 0)).rejects.toThrow(
      'Session save failed',
    );
    expect(order).toEqual(['rotate', 'save']);
    expect(request.session.principal).toBeUndefined();
  });

  it('logout tolerates invalid authentication but does not hide storage failures', async () => {
    const { service, request, prisma } = fixture();
    const context = { switchToHttp: () => ({ getRequest: () => request }) };
    const guard = new LogoutAuthGuard(service);
    prisma.user.findUnique.mockRejectedValueOnce(new Error('offline'));
    await expect(guard.canActivate(context as never)).rejects.toThrow(
      'offline',
    );
    request.session.principal!.expiresAt = 0;
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    await expect(
      new SessionAuthGuard(service).canActivate(context as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    delete request.session.principal;
    await expect(
      new OptionalSessionAuthGuard(service).canActivate(context as never),
    ).resolves.toBe(true);
  });
});
