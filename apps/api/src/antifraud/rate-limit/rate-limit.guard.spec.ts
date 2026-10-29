import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';

import { RateLimitGuard } from './rate-limit.guard';
const limiter = () => { const counts = new Map<string, number>(); return { consumeRateLimit: vi.fn(async (key: string, limit: number) => { const count = (counts.get(key) ?? 0) + 1; counts.set(key, count); return count <= limit; }) }; };

describe('RateLimitGuard', () => {
  it('limits requests per user and resource', async () => {
    const reflector = {
      getAllAndOverride: () => ({
        keyPrefix: 'bids:place',
        limit: 1,
        windowMs: 60_000,
        scope: 'user-resource',
        resourceParam: 'auctionId',
      }),
    } satisfies Pick<Reflector, 'getAllAndOverride'>;
    const guard = new RateLimitGuard(
      reflector,
      limiter(),
    );
    const createContext = () =>
      new ExecutionContextHost([
        {
          auth: {
            sub: 'user-1',
          },
          params: {
            auctionId: 'auction-1',
          },
          headers: {},
        },
      ]);

    expect(await guard.canActivate(createContext())).toBe(true);
    try {
      await guard.canActivate(createContext());
      throw new Error('Expected rate limit exception');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('uses socket remote address when trust proxy is disabled', async () => {
    const reflector = {
      getAllAndOverride: () => ({
        keyPrefix: 'auth:login',
        limit: 1,
        windowMs: 60_000,
        scope: 'ip',
      }),
    } satisfies Pick<Reflector, 'getAllAndOverride'>;
    const guard = new RateLimitGuard(
      reflector,
      limiter(),
      false,
    );
    const createContext = (forwardedFor: string) =>
      new ExecutionContextHost([
        {
          params: {},
          headers: {
            'x-forwarded-for': forwardedFor,
          },
          socket: {
            remoteAddress: '10.0.0.1',
          },
        },
      ]);

    expect(await guard.canActivate(createContext('203.0.113.1'))).toBe(true);
    await expect(guard.canActivate(createContext('198.51.100.2'))).rejects.toThrow(
      HttpException,
    );
  });

  it('uses proxied request.ip when trust proxy is enabled', async () => {
    const reflector = {
      getAllAndOverride: () => ({
        keyPrefix: 'auth:login',
        limit: 1,
        windowMs: 60_000,
        scope: 'ip',
      }),
    } satisfies Pick<Reflector, 'getAllAndOverride'>;
    const guard = new RateLimitGuard(
      reflector,
      limiter(),
      true,
    );
    const createContext = (ip: string) =>
      new ExecutionContextHost([
        {
          ip,
          params: {},
          headers: {},
          socket: {
            remoteAddress: '10.0.0.1',
          },
        },
      ]);

    expect(await guard.canActivate(createContext('203.0.113.1'))).toBe(true);
    expect(await guard.canActivate(createContext('198.51.100.2'))).toBe(true);
  });

  it('does not trust X-Forwarded-For when trust proxy is enabled but request.ip is missing', async () => {
    const reflector = {
      getAllAndOverride: () => ({
        keyPrefix: 'auth:login',
        limit: 1,
        windowMs: 60_000,
        scope: 'ip',
      }),
    } satisfies Pick<Reflector, 'getAllAndOverride'>;
    const guard = new RateLimitGuard(
      reflector,
      limiter(),
      true,
    );
    const createContext = (forwardedFor: string) =>
      new ExecutionContextHost([
        {
          params: {},
          headers: {
            'x-forwarded-for': forwardedFor,
          },
          socket: {
            remoteAddress: '10.0.0.1',
          },
        },
      ]);

    expect(await guard.canActivate(createContext('203.0.113.1'))).toBe(true);
    await expect(guard.canActivate(createContext('198.51.100.2'))).rejects.toThrow(
      HttpException,
    );
  });
  it('rejects when durable storage fails instead of allowing the request', async () => {
    const failure = new Error('synthetic storage failure');
    const guard = new RateLimitGuard({ getAllAndOverride: () => ({ keyPrefix: 'auth:login', limit: 1, windowMs: 60_000, scope: 'ip' }) }, { consumeRateLimit: vi.fn().mockRejectedValue(failure) });
    await expect(guard.canActivate(new ExecutionContextHost([{ params: {}, socket: { remoteAddress: '127.0.0.1' } }]))).rejects.toBe(failure);
  });

});
