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
    const guard = new RateLimitGuard(
      reflector as Reflector,
      new RateLimitService(),
    );
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
      }) as never;

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
});
