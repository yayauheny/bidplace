import { describe, expect, it } from 'vitest';

import { Decimal, Prisma, PrismaClient } from './index';

describe('database public exports', () => {
  it('exposes PrismaClient and evaluates Decimal through the package entry', () => {
    expect(typeof PrismaClient).toBe('function');
    expect(Prisma.Decimal).toBe(Decimal);

    const total = new Decimal('10.50').plus(new Decimal('1.25'));

    expect(total.equals(new Decimal('11.75'))).toBe(true);
    expect(total.toFixed(2)).toBe('11.75');
  });
});
