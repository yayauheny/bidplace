import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AdminGuard } from './admin.guard';

function contextFor(auth?: { role?: string }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ auth }),
    }),
  } as Parameters<AdminGuard['canActivate']>[0];
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('allows an admin', () => {
    expect(guard.canActivate(contextFor({ role: 'admin' }))).toBe(true);
  });

  it('rejects a signed-in non-admin', () => {
    expect(() => guard.canActivate(contextFor({ role: 'user' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects a missing role', () => {
    expect(() => guard.canActivate(contextFor())).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextFor({}))).toThrow(
      'Admin access required',
    );
  });
});
