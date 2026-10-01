import { describe, expect, it } from 'vitest';

import {
  isPrismaSerializableConflictError,
  isPrismaUniqueConstraintError,
} from './prisma-error';

describe('prisma error helpers', () => {
  it('detects unique constraint errors', () => {
    expect(isPrismaUniqueConstraintError({ code: 'P2002' })).toBe(true);
    expect(isPrismaUniqueConstraintError({ code: 'P2034' })).toBe(false);
  });

  it('detects serializable conflict errors', () => {
    expect(isPrismaSerializableConflictError({ code: 'P2034' })).toBe(true);
    expect(isPrismaSerializableConflictError({ code: 'P2002' })).toBe(false);
  });

  it('returns false for non-prisma values', () => {
    expect(isPrismaUniqueConstraintError(null)).toBe(false);
    expect(isPrismaUniqueConstraintError(new Error('boom'))).toBe(false);
    expect(isPrismaSerializableConflictError('P2034')).toBe(false);
  });
});
