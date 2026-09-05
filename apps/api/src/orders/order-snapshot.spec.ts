import { describe, expect, it, vi } from 'vitest';

import {
  createOrderSnapshot,
  IncompleteOrderSnapshotError,
  loadOrderDealSnapshot,
  resolveOrderDealFields,
} from './order-snapshot';

const contact = {
  sellerHandoffType: 'TELEGRAM' as const,
  sellerHandoffValue: '@seller',
  buyerEmailAtClose: 'buyer@example.com',
  handoffInitiator: 'BUYER_CONTACTS_SELLER' as const,
};

describe('order snapshot', () => {
  it('freezes trimmed title, currency and product public id with contacts', () => {
    expect(
      createOrderSnapshot({
        ...contact,
        snapshotTitle: '  Closed work  ',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0001',
      }),
    ).toEqual({
      ...contact,
      snapshotTitle: 'Closed work',
      snapshotCurrency: 'BYN',
      snapshotProductPublicId: 'product0001',
    });
  });

  it('rejects an incomplete deal snapshot', () => {
    expect(() =>
      createOrderSnapshot({
        ...contact,
        snapshotTitle: '',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0001',
      }),
    ).toThrow(IncompleteOrderSnapshotError);
  });

  it('loads the Listing product fields inside the create transaction', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      currency: 'BYN',
      product: { title: ' Live title ', publicId: 'product0001' },
    });

    await expect(
      loadOrderDealSnapshot(
        { listing: { findUnique } },
        'listing-1',
      ),
    ).resolves.toEqual({
      snapshotTitle: 'Live title',
      snapshotCurrency: 'BYN',
      snapshotProductPublicId: 'product0001',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      select: {
        currency: true,
        product: { select: { title: true, publicId: true } },
      },
    });
  });

  it('prefers frozen fields over a later live Product title', () => {
    expect(
      resolveOrderDealFields({
        snapshotTitle: 'Frozen title',
        snapshotCurrency: 'BYN',
        snapshotProductPublicId: 'product0001',
        listing: {
          currency: 'RUB',
          product: { title: 'Changed title', publicId: 'changed0001' },
        },
      }),
    ).toEqual({
      title: 'Frozen title',
      currency: 'BYN',
      productPublicId: 'product0001',
    });
  });

  it('falls back to live Listing fields for historical Orders without a snapshot', () => {
    expect(
      resolveOrderDealFields({
        snapshotTitle: null,
        snapshotCurrency: null,
        snapshotProductPublicId: null,
        listing: {
          currency: 'BYN',
          product: { title: 'Legacy title', publicId: 'product0001' },
        },
      }),
    ).toEqual({
      title: 'Legacy title',
      currency: 'BYN',
      productPublicId: 'product0001',
    });
  });
});
