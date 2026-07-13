import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('rejects non-admin users', () => {
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            auth: { role: 'user' },
          }),
        }),
      } as never),
    ).toThrow(ForbiddenException);
  });
});
