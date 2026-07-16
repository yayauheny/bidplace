import { describe, expect, it } from 'vitest';

import { Prisma } from './index';

describe('database package exports', () => {
  it('does not expose enum ownership for contract fields', () => {
    expect(Object.keys((Prisma as { $Enums?: Record<string, unknown> }).$Enums ?? {})).toEqual([]);
  });
});
