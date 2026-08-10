import { describe, expect, it, vi } from 'vitest';

import { ImagesService } from './images.service';

describe('ImagesService', () => {
  it('checks aggregate Product capacity inside a serializable transaction', async () => {
    const createMany = vi.fn();
    const tx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          images: Array.from({ length: 8 }, (_, position) => ({
            position,
            byteLength: 1,
          })),
        }),
      },
      productImage: { createMany },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new ImagesService(prisma as never);

    await expect(
      service.add('owner-id', 'product-id', [
        { buffer: Buffer.from([1]), mimeType: 'image/png' },
      ]),
    ).rejects.toThrow('A Product can have at most 8 images');
    expect(createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('does not expose approved Product media when the seller is suspended', async () => {
    const prisma = {
      productImage: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'image-id',
          product: {
            status: 'APPROVED',
            sellerProfile: {
              userId: 'owner-id',
              status: 'SUSPENDED',
            },
            listings: [{ id: 'listing-id', status: 'LIVE' }],
          },
        }),
      },
    };
    const service = new ImagesService(prisma as never);

    await expect(service.get('image-id')).rejects.toThrow('Image not found');
    await expect(
      service.get('image-id', 'owner-id', 'user'),
    ).resolves.toMatchObject({
      id: 'image-id',
      isPublic: false,
    });
  });

  it('reorders images through temporary positions before final positions', async () => {
    const update = vi.fn().mockResolvedValue({});
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          images: [
            { id: 'image-a', position: 0 },
            { id: 'image-b', position: 1 },
          ],
        }),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          productImage: {
            update,
          },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never);

    await service.reorder('owner-id', 'product-id', ['image-b', 'image-a']);

    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      2, 3, 0, 1,
    ]);
  });

  it('reindexes remaining images through temporary positions when removing one', async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 'image-b' }, { id: 'image-c' }]);
    const prisma = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'DRAFT',
          sellerProfile: {
            userId: 'owner-id',
            status: 'APPROVED',
          },
          images: [
            { id: 'image-a', position: 0 },
            { id: 'image-b', position: 1 },
            { id: 'image-c', position: 2 },
          ],
        }),
      },
      $transaction: vi.fn(async (callback: (tx: never) => Promise<unknown>) =>
        callback({
          productImage: {
            findMany,
            delete: deleteImage,
            update,
          },
        } as never),
      ),
    };
    const service = new ImagesService(prisma as never);

    await service.remove('owner-id', 'product-id', 'image-a');

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(deleteImage).toHaveBeenCalledWith({ where: { id: 'image-a' } });
    expect(update.mock.calls.map(([args]) => args.data.position)).toEqual([
      3, 4, 0, 1,
    ]);
  });
});
