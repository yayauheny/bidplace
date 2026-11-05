import type { OrderDetail } from '@bidplace/contracts';
import { describe, expect, it } from 'vitest';

import { orderActions, orderContactLinks, orderStatusLabel } from './order-view';

const NOW = Date.parse('2026-11-02T12:00:00.000Z');
const BEFORE = '2026-11-02T18:00:00.000Z';
const AFTER = '2026-11-02T06:00:00.000Z';

function order(patch: Partial<OrderDetail> = {}): OrderDetail {
  return {
    publicId: 'orderPanel1',
    dealCode: '123456',
    status: 'ACTIVE',
    source: 'FIXED_PURCHASE',
    amountMinor: 125000,
    currency: 'BYN',
    workTitle: 'Работа',
    sellerNameSnapshot: 'Автор',
    workPublicId: 'workpublic01',
    coverImageUrl: null,
    role: 'buyer',
    createdAt: '2026-11-01T12:00:00.000Z',
    contactDeadlineAt: BEFORE,
    offerExpiresAt: null,
    buyerComment: null,
    sellerNote: null,
    failReason: null,
    faultSide: null,
    completedAt: null,
    failedAt: null,
    buyerContacts: null,
    sellerContacts: null,
    sellerContactHint: null,
    ...patch,
  };
}

describe('orderActions', () => {
  it.each([
    ['buyer offered', { role: 'buyer' as const, status: 'OFFERED' as const, offerExpiresAt: BEFORE }, ['accept', 'declineOffer']],
    ['buyer offered expired', { role: 'buyer' as const, status: 'OFFERED' as const, offerExpiresAt: AFTER }, ['declineOffer']],
    ['buyer active', { role: 'buyer' as const, status: 'ACTIVE' as const }, ['buyerRefuse', 'report', 'paymentWarning']],
    ['seller active', { role: 'seller' as const, status: 'ACTIVE' as const }, ['complete', 'report']],
    ['seller fixed failed', { role: 'seller' as const, status: 'FAILED' as const, source: 'FIXED_PURCHASE' as const, failReason: 'BUYER_REFUSED' as const, failedAt: AFTER }, ['report', 'resaleNote']],
    ['seller auction buyer fault', { role: 'seller' as const, status: 'FAILED' as const, source: 'AUCTION_WIN' as const, failReason: 'BUYER_NO_CONTACT' as const, failedAt: AFTER }, ['offerNext', 'relist', 'report']],
    ['seller auction own refusal', { role: 'seller' as const, status: 'FAILED' as const, source: 'AUCTION_WIN' as const, failReason: 'SELLER_REFUSED' as const, failedAt: AFTER }, ['relist', 'report']],
    ['buyer completed inside 14 days', { role: 'buyer' as const, status: 'COMPLETED' as const, completedAt: AFTER }, ['report']],
    ['buyer completed after 14 days', { role: 'buyer' as const, status: 'COMPLETED' as const, completedAt: '2026-10-01T12:00:00.000Z' }, []],
  ])('%s', (_name, patch, keys) => {
    const model = orderActions(order(patch), NOW);
    const enabled = (Object.keys(model) as Array<keyof typeof model>).filter(
      (key) => key !== 'failReasons' && model[key] === true,
    );
    expect(enabled.sort()).toEqual([...keys].sort());
  });

  it('hides a new sale on an existing order when the author cannot start one', () => {
    const model = orderActions(
      order({
        role: 'seller',
        status: 'FAILED',
        source: 'AUCTION_WIN',
        failReason: 'BUYER_NO_CONTACT',
        failedAt: AFTER,
      }),
      NOW,
      { canStartSale: false },
    );
    expect(model.offerNext).toBe(false);
    expect(model.relist).toBe(false);
    expect(model.report).toBe(true);
    expect(model.complete).toBe(false);
  });

  it('keeps contact reasons locked until the deadline and does not call a sale sold', () => {
    const early = orderActions(order({ role: 'seller' }), NOW);
    expect(early.failReasons.find((item) => item.reason === 'BUYER_NO_CONTACT')).toMatchObject({
      enabled: false,
    });
    const late = orderActions(
      order({ role: 'seller', contactDeadlineAt: AFTER }),
      NOW,
    );
    expect(late.failReasons.find((item) => item.reason === 'BUYER_INVALID_CONTACTS')?.enabled).toBe(
      true,
    );
    expect(orderStatusLabel(order({ status: 'ACTIVE' }))).toBe('Ждёт связи');
    expect(orderStatusLabel(order({ status: 'COMPLETED' }))).toBe('Состоялась');
  });

  it('builds contact links from the order payload only', () => {
    expect(
      orderContactLinks({
        email: 'buyer@example.com',
        phone: '+375291112233',
        telegram: '@buyer',
        instagram: 'buyer',
        vk: null,
      }),
    ).toEqual([
      { label: 'buyer@example.com', href: 'mailto:buyer@example.com' },
      { label: '+375291112233', href: 'tel:+375291112233' },
      { label: '@buyer', href: 'https://t.me/buyer' },
      { label: 'buyer', href: 'https://instagram.com/buyer' },
    ]);
  });
});
