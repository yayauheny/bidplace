import { describe, expect, it } from 'vitest';

import {
  isPrismaSerializableConflictError,
  isPrismaUniqueConstraintError,
  prismaUniqueTargets,
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

  it('reads unique constraint targets without treating an unknown target as a field', () => {
    expect(prismaUniqueTargets({ code: 'P2002', meta: { target: ['slug'] } })).toEqual(['slug']);
    expect(prismaUniqueTargets({ code: 'P2002', meta: { target: 'user_id' } })).toEqual(['user_id']);
    expect(prismaUniqueTargets({ code: 'P2002' })).toEqual([]);
    expect(prismaUniqueTargets({ code: 'P2034', meta: { target: ['slug'] } })).toEqual([]);
  });

  it('returns false for non-prisma values', () => {
    expect(isPrismaUniqueConstraintError(null)).toBe(false);
    expect(isPrismaUniqueConstraintError(new Error('boom'))).toBe(false);
    expect(isPrismaSerializableConflictError('P2034')).toBe(false);
  });
});
