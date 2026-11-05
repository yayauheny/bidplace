import { describe, expect, it } from 'vitest';
import type { OrderDetail } from '@bidplace/contracts';
import { receiptData } from './receipt-data';

const order: OrderDetail = {
  publicId: 'abcdefghijk', dealCode: '123456', status: 'COMPLETED', source: 'FIXED_PURCHASE',
  amountMinor: 12500, currency: 'BYN', workTitle: 'Работа', workPublicId: 'workpublic1',
  coverImageUrl: null, role: 'buyer', createdAt: '2026-11-01T10:00:00.000Z',
  sellerNameSnapshot: 'Сохранённый автор', contactDeadlineAt: null, offerExpiresAt: null,
  buyerComment: 'private comment', sellerNote: 'private note', failReason: null, faultSide: null,
  completedAt: '2026-11-01T10:00:00.000Z', failedAt: null,
  buyerContacts: { email: 'private@example.invalid', phone: '+375000000', telegram: null, instagram: null, vk: null },
  sellerContacts: null, sellerContactHint: null,
};
describe('receipt data privacy', () => {
  it('uses the order snapshot and excludes all private contact and note fields', () => {
    const data = receiptData(order);
    expect(data.author).toBe('Сохранённый автор');
    expect(Object.keys(data).sort()).toEqual(['amount', 'author', 'completedAt', 'dealCode', 'publicId', 'source', 'workTitle']);
    expect(JSON.stringify(data)).not.toMatch(/private|375000/);
  });
  it.each([{ status: 'ACTIVE' }, { role: 'admin' }, { completedAt: null }] as const)('rejects invalid eligibility %j', (patch) => {
    expect(() => receiptData({ ...order, ...patch })).toThrow();
  });
});
