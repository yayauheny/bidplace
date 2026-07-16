import { HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitService } from './rate-limit.service';

describe('RateLimitGuard', () => {
  it('limits requests per user and resource', () => {
    const reflector = {
      getAllAndOverride: () => ({
        keyPrefix: 'bids:place',
        limit: 1,
        windowMs: 60_000,
        scope: 'user-resource',
        resourceParam: 'auctionId',
      }),
    } satisfies Pick<Reflector, 'getAllAndOverride'>;
    const guard = new RateLimitGuard(reflector, new RateLimitService());
    const createContext = () =>
      ({
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({
          getRequest: () => ({
            auth: {
              sub: 'user-1',
            },
            params: {
              auctionId: 'auction-1',
            },
            headers: {},
          }),
        }),
      }) satisfies Parameters<RateLimitGuard['canActivate']>[0];

    expect(guard.canActivate(createContext())).toBe(true);
    try {
      guard.canActivate(createContext());
      throw new Error('Expected rate limit exception');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('ignores X-Forwarded-For when trust proxy is disabled', () => {
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
      new RateLimitService({ maxBuckets: 10, cleanupIntervalMs: 1_000 }),
      false,
    );
    const createContext = (forwardedFor: string) =>
      ({
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({
          getRequest: () => ({
            params: {},
            headers: {
              'x-forwarded-for': forwardedFor,
            },
            socket: {
              remoteAddress: '10.0.0.1',
            },
          }),
        }),
      }) satisfies Parameters<RateLimitGuard['canActivate']>[0];

    expect(guard.canActivate(createContext('203.0.113.1'))).toBe(true);
    expect(() => guard.canActivate(createContext('198.51.100.2'))).toThrow(
      HttpException,
    );
  });

  it('uses proxied request.ip when trust proxy is enabled', () => {
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
      new RateLimitService({ maxBuckets: 10, cleanupIntervalMs: 1_000 }),
      true,
    );
    const createContext = (ip: string) =>
      ({
        getHandler: () => null,
        getClass: () => null,
        switchToHttp: () => ({
          getRequest: () => ({
            ip,
            params: {},
            headers: {},
            socket: {
              remoteAddress: '10.0.0.1',
            },
          }),
        }),
      }) satisfies Parameters<RateLimitGuard['canActivate']>[0];

    expect(guard.canActivate(createContext('203.0.113.1'))).toBe(true);
    expect(guard.canActivate(createContext('198.51.100.2'))).toBe(true);
  });
});
