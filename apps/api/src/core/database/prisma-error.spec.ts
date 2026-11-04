import { describe, expect, it } from 'vitest';

import {
  isPrismaSerializableConflictError,
  isPrismaTransactionStartTimeout,
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
    expect(
      isPrismaSerializableConflictError({
        code: 'P2010',
        meta: { code: '40001' },
      }),
    ).toBe(true);
    expect(
      isPrismaSerializableConflictError({
        code: 'P2010',
        meta: { code: '42P01' },
      }),
    ).toBe(false);
  });

  it('reads unique constraint targets without treating an unknown target as a field', () => {
    expect(
      prismaUniqueTargets({ code: 'P2002', meta: { target: ['slug'] } }),
    ).toEqual(['slug']);
    expect(
      prismaUniqueTargets({ code: 'P2002', meta: { target: 'user_id' } }),
    ).toEqual(['user_id']);
    expect(prismaUniqueTargets({ code: 'P2002' })).toEqual([]);
    expect(
      prismaUniqueTargets({ code: 'P2034', meta: { target: ['slug'] } }),
    ).toEqual([]);
  });

  it('detects only the interactive transaction start timeout', () => {
    expect(
      isPrismaTransactionStartTimeout({
        code: 'P2028',
        message:
          'Transaction API error: Unable to start a transaction in the given time.',
      }),
    ).toBe(true);
    expect(
      isPrismaTransactionStartTimeout({
        code: 'P2028',
        message:
          'Transaction API error: A query cannot be executed on an expired transaction.',
      }),
    ).toBe(false);
    expect(
      isPrismaTransactionStartTimeout({
        code: 'P2034',
        message: 'Unable to start a transaction in the given time.',
      }),
    ).toBe(false);
    expect(isPrismaTransactionStartTimeout(new Error('P2028'))).toBe(false);
  });

  it('returns false for non-prisma values', () => {
    expect(isPrismaUniqueConstraintError(null)).toBe(false);
    expect(isPrismaUniqueConstraintError(new Error('boom'))).toBe(false);
    expect(isPrismaSerializableConflictError('P2034')).toBe(false);
  });
});
