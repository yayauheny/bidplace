import { describe, expect, it } from 'vitest';
import type { OrderReceiptData } from '@bidplace/contracts';
import { receiptData } from './receipt-data';

const data: OrderReceiptData = {
  publicId: 'abcdefghijk', dealCode: '123456', source: 'FIXED_PURCHASE',
  amountMinor: 12500, currency: 'BYN', workTitle: 'Работа',
  coverImageUrl: null, sellerNameSnapshot: 'Сохранённый автор',
  completedAt: '2026-11-01T10:00:00.000Z',
};
describe('receipt data privacy', () => {
  it('uses the order snapshot and excludes all private contact and note fields', () => {
    const response = { ...data, buyerContacts: 'private', sellerNote: 'private' };
    const result = receiptData(response);
    expect(result.author).toBe('Сохранённый автор');
    expect(Object.keys(result).sort()).toEqual(['amount', 'author', 'completedAt', 'dealCode', 'publicId', 'source', 'workTitle']);
    expect(JSON.stringify(result)).not.toMatch(/private/);
  });
});
