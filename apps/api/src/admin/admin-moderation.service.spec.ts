import { describe, expect, it, vi } from 'vitest';

import { ConflictException } from '@nestjs/common';

import { AdminModerationService } from './admin-moderation.service';

function transactionPrisma(tx: object) {
  return {
    $transaction: vi.fn(async (callback: (client: object) => Promise<unknown>) =>
      callback(tx),
    ),
  };
}

describe('AdminModerationService', () => {
  it('allows APPROVED product to move to CHANGES_REQUESTED with a reason', async () => {
    const product = {
      id: 'product-id',
      status: 'APPROVED',
      sellerProfile: { status: 'APPROVED' },
      images: [{ id: 'image-id' }],
      listings: [],
    };
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue(product),
        update: vi.fn().mockResolvedValue(product),
      },
      auditEvent: { create: vi.fn() },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await service.updateProductStatus('admin-id', 'product-id', {
      status: 'CHANGES_REQUESTED',
      reason: 'Добавьте подтверждение происхождения',
    });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-id' },
      data: { status: 'CHANGES_REQUESTED' },
    });
    expect(tx.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: 'Добавьте подтверждение происхождения',
          newStatus: 'CHANGES_REQUESTED',
        }),
      }),
    );
  });

  it('blocks a limiting product action while its listing is LIVE', async () => {
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'product-id',
          status: 'APPROVED',
          sellerProfile: { status: 'APPROVED' },
          images: [{ id: 'image-id' }],
          listings: [{ id: 'listing-id' }],
        }),
      },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await expect(
      service.updateProductStatus('admin-id', 'product-id', {
        status: 'CHANGES_REQUESTED',
        reason: 'Нужна правка',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks seller suspension while one of its listings is LIVE', async () => {
    const tx = {
      sellerProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'seller-id',
          status: 'APPROVED',
        }),
      },
      listing: {
        findFirst: vi.fn().mockResolvedValue({ id: 'listing-id' }),
      },
    };
    const service = new AdminModerationService(transactionPrisma(tx) as never);

    await expect(
      service.updateSellerStatus('admin-id', 'seller-id', {
        status: 'SUSPENDED',
        reason: 'Нужна проверка',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
