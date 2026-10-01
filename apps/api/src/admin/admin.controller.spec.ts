import { describe, expect, it, vi } from 'vitest';

import { adminModerationListQuerySchema } from '@bidplace/contracts';

import { AdminController } from './admin.controller';

function controllerWith(moderation: object) {
  return new AdminController(
    moderation as never,
    {} as never,
    {} as never,
    {} as never,
    { now: () => new Date() } as never,
  );
}

describe('AdminController', () => {
  it('delegates seller moderation projections without a Prisma dependency', async () => {
    const response = { sellerProfiles: [], nextCursor: null };
    const moderation = {
      listSellerProfiles: vi.fn().mockResolvedValue(response),
    };

    await expect(controllerWith(moderation).listSellers({})).resolves.toBe(
      response,
    );
    expect(moderation.listSellerProfiles).toHaveBeenCalledWith(
      adminModerationListQuerySchema.parse({}),
    );
  });

  it('delegates product moderation projections without a Prisma dependency', async () => {
    const response = { products: [], nextCursor: null };
    const moderation = { listProducts: vi.fn().mockResolvedValue(response) };
    const query = adminModerationListQuerySchema.parse({
      limit: '100',
      filter: 'PENDING_REVIEW',
      search: ' Ceramic ',
    });

    await expect(
      controllerWith(moderation).listProducts({
        limit: '100',
        filter: 'PENDING_REVIEW',
        search: ' Ceramic ',
      }),
    ).resolves.toBe(response);
    expect(moderation.listProducts).toHaveBeenCalledWith(query);
  });

  it('delegates product status changes and canonical readback to moderation', async () => {
    const response = { product: { id: 'product-id' } };
    const moderation = {
      updateProductStatusAndReadback: vi.fn().mockResolvedValue(response),
    };

    await expect(
      controllerWith(moderation).updateProduct(
        { sub: 'admin-id' },
        'product-id',
        {
          status: 'APPROVED',
          target: {
            kind: 'parent',
            status: 'PENDING_REVIEW',
            updatedAt: '2026-09-26T12:00:00.000Z',
          },
        },
      ),
    ).resolves.toBe(response);
    expect(moderation.updateProductStatusAndReadback).toHaveBeenCalledWith(
      'admin-id',
      'product-id',
      {
        status: 'APPROVED',
        target: {
          kind: 'parent',
          status: 'PENDING_REVIEW',
          updatedAt: '2026-09-26T12:00:00.000Z',
        },
      },
    );
  });
});
