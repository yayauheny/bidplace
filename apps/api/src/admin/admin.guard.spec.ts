import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('rejects non-admin users', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          auth: { role: 'user' },
        }),
      }),
    } satisfies Pick<Parameters<AdminGuard['canActivate']>[0], 'switchToHttp'>;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
