import { type ExecutionContext, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { syntheticServerEnv } from '../config/synthetic-server-env';
import { InternalTickGuard } from './internal-tick.guard';

const secret = 'synthetic-internal-tick-test-key-32';
function context(header?: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ get: () => header }) }),
  } as ExecutionContext;
}
describe('InternalTickGuard', () => {
  it.each([undefined, '', 'wrong', 'x'.repeat(secret.length), `${secret}x`])(
    'returns not found for a missing or wrong header (%s)',
    (header) => {
      const guard = new InternalTickGuard(
        syntheticServerEnv({ INTERNAL_TICK_SECRET: secret }),
      );
      expect(() => guard.canActivate(context(header))).toThrow(
        NotFoundException,
      );
    },
  );
  it('accepts the exact configured secret', () => {
    const guard = new InternalTickGuard(
      syntheticServerEnv({ INTERNAL_TICK_SECRET: secret }),
    );
    expect(guard.canActivate(context(secret))).toBe(true);
  });
  it('fails closed when no secret is configured locally', () => {
    const guard = new InternalTickGuard(syntheticServerEnv());
    expect(() => guard.canActivate(context(secret))).toThrow(NotFoundException);
  });
});
