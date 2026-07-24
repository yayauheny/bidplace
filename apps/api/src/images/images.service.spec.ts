import { describe, expect, it, vi } from 'vitest';

import { ImagesService } from './images.service';

describe('ImagesService', () => {
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
      2,
      3,
      0,
      1,
    ]);
  });

  it('reindexes remaining images through temporary positions when removing one', async () => {
    const update = vi.fn().mockResolvedValue({});
    const deleteImage = vi.fn().mockResolvedValue({});
    const findMany = vi.fn().mockResolvedValue([
      { id: 'image-b' },
      { id: 'image-c' },
    ]);
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
      3,
      4,
      0,
      1,
    ]);
  });
});
