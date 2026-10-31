import { describe, expect, it } from 'vitest';

import { formatMoney, parseMoneyInput } from './money';

function shown(value: string) {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

describe('formatMoney', () => {
  it('prints whole major units without kopecks and keeps a two-digit fraction', () => {
    expect(shown(formatMoney(125000, 'BYN'))).toBe('1 250 BYN');
    expect(shown(formatMoney(1250, 'BYN'))).toBe('12,50 BYN');
    expect(shown(formatMoney(125000, 'RUB'))).toBe('1 250 ₽');
    expect(shown(formatMoney(1250, 'RUB'))).toBe('12,50 ₽');
  });
});

describe('parseMoneyInput', () => {
  it('reads comma, dot, and grouped major units as minor units', () => {
    expect(parseMoneyInput('12,5', 'BYN')).toBe(1250);
    expect(parseMoneyInput('12.50', 'BYN')).toBe(1250);
    expect(parseMoneyInput('1 250', 'RUB')).toBe(125000);
    expect(parseMoneyInput('1\u00a0250', 'BYN')).toBe(125000);
  });

  it('rejects garbage', () => {
    expect(parseMoneyInput('abc', 'BYN')).toBeNull();
    expect(parseMoneyInput('', 'RUB')).toBeNull();
    expect(parseMoneyInput('12.555', 'BYN')).toBeNull();
    expect(parseMoneyInput('-1', 'BYN')).toBeNull();
    expect(parseMoneyInput('NaN', 'RUB')).toBeNull();
    expect(parseMoneyInput('Infinity', 'BYN')).toBeNull();
  });

  it('keeps exact minor units inside the safe integer range and rejects the rest', () => {
    expect(parseMoneyInput('90071992547409.90', 'BYN')).toBe(9007199254740990);
    expect(parseMoneyInput('90071992547409.91', 'RUB')).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(parseMoneyInput('90071992547409.92', 'BYN')).toBeNull();
    expect(parseMoneyInput('9'.repeat(307), 'RUB')).toBeNull();
    expect(parseMoneyInput('0', 'BYN')).toBe(0);
  });
});
