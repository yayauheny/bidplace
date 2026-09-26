import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { VerifiedEmailGuard } from './verified-email.guard';

function contextFor(userId: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ auth: { sub: userId } }) }),
  } as never;
}

describe('VerifiedEmailGuard', () => {
  it('allows only a session whose persisted user has verified email', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ emailVerifiedAt: null })
      .mockResolvedValueOnce({ emailVerifiedAt: new Date() });
    const guard = new VerifiedEmailGuard({ user: { findUnique } } as never);

    await expect(guard.canActivate(contextFor('unverified-user'))).rejects.toEqual(
      new ForbiddenException('Email verification is required'),
    );
    await expect(guard.canActivate(contextFor('verified-user'))).resolves.toBe(
      true,
    );
  });
});
