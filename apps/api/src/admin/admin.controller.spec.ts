import { describe, expect, it, vi } from 'vitest';

import { BearerAuthGuard } from '../auth';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';

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
  it('keeps analytics overview behind bearer auth and the admin guard', () => {
    const guards = Reflect.getMetadata('__guards__', AdminController) as
      | unknown[]
      | undefined;

    expect(guards).toEqual(
      expect.arrayContaining([BearerAuthGuard, AdminGuard]),
    );
  });

  it('delegates seller moderation projections without a Prisma dependency', async () => {
    const response = { sellerProfiles: [] };
    const moderation = {
      listSellerProfiles: vi.fn().mockResolvedValue(response),
    };

    await expect(controllerWith(moderation).listSellers()).resolves.toBe(
      response,
    );
    expect(moderation.listSellerProfiles).toHaveBeenCalledOnce();
  });

  it('delegates product moderation projections without a Prisma dependency', async () => {
    const response = { products: [] };
    const moderation = { listProducts: vi.fn().mockResolvedValue(response) };

    await expect(controllerWith(moderation).listProducts()).resolves.toBe(
      response,
    );
    expect(moderation.listProducts).toHaveBeenCalledOnce();
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
