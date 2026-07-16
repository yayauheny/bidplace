import type { AuthTokenPayload } from '@bidplace/contracts';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImagesService, type ImagesRepository } from './images.service';

function createAuth(
  overrides: Partial<AuthTokenPayload> = {},
): AuthTokenPayload {
  return {
    sub: 'user-1',
    email: 'user@example.com',
    role: 'user',
    sessionVersion: 1,
    iat: 1,
    exp: 2,
    ...overrides,
  };
}

describe('ImagesService', () => {
  const prisma = {
    lot: {
      findUnique: vi.fn(),
    },
    lotImage: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  } satisfies ImagesRepository;

  const service = new ImagesService(prisma);

  beforeEach(() => {
    vi.resetAllMocks();
    prisma.$transaction.mockImplementation(async (callback: unknown) =>
      (callback as (tx: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it('returns published images without auth', async () => {
    prisma.lotImage.findUnique.mockResolvedValue({
      id: '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      mimeType: 'image/png',
      byteLength: 12,
      data: Uint8Array.from([1, 2, 3]),
      checksum: 'checksum',
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: 'published',
        sellerProfile: {
          userId: 'f98116cb-9391-4272-920d-04917bd2c9af',
        },
      },
    });

    const result = await service.getImage('9cb88056-f0dc-4309-84e4-090af8ace1e2');

    expect(result.mimeType).toBe('image/png');
    expect(result.isPublic).toBe(true);
    expect(result.data).toEqual(Buffer.from([1, 2, 3]));
  });

  it('hides draft images from anonymous users', async () => {
    prisma.lotImage.findUnique.mockResolvedValue({
      id: '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      mimeType: 'image/png',
      byteLength: 12,
      data: Uint8Array.from([1, 2, 3]),
      checksum: 'checksum',
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: 'draft',
        sellerProfile: {
          userId: 'f98116cb-9391-4272-920d-04917bd2c9af',
        },
      },
    });

    await expect(service.getImage('9cb88056-f0dc-4309-84e4-090af8ace1e2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('allows owners to read draft images', async () => {
    prisma.lotImage.findUnique.mockResolvedValue({
      id: '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      mimeType: 'image/png',
      byteLength: 12,
      data: Uint8Array.from([1, 2, 3]),
      checksum: 'checksum',
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: 'draft',
        sellerProfile: {
          userId: 'user-1',
        },
      },
    });

    const result = await service.getImage(
      '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      createAuth(),
    );

    expect(result.isPublic).toBe(false);
  });

  it('deletes an image and compacts remaining positions', async () => {
    prisma.lotImage.findUnique.mockResolvedValue({
      id: '497d0f80-12eb-43c4-931f-816225c92c8b',
      lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      position: 1,
      lot: {
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: 'draft',
        sellerProfile: {
          userId: 'user-1',
        },
        lotImages: [
          { id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 },
          { id: '497d0f80-12eb-43c4-931f-816225c92c8b', position: 1 },
        ],
      },
    });
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
      categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
      title: 'Lot',
      description: 'Description',
      condition: 'excellent',
      lotImages: [{ id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 }],
      status: 'draft',
      createdAt: new Date('2026-07-13T12:00:00.000Z'),
      updatedAt: new Date('2026-07-13T12:00:00.000Z'),
    });

    const result = await service.deleteLotImage(
      createAuth(),
      '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      '497d0f80-12eb-43c4-931f-816225c92c8b',
    );

    expect(prisma.lotImage.delete).toHaveBeenCalledWith({
      where: {
        id: '497d0f80-12eb-43c4-931f-816225c92c8b',
      },
    });
    expect(prisma.lotImage.updateMany).toHaveBeenCalledWith({
      where: {
        lotId: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        position: {
          gt: 1,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });
    expect(result.lot.images).toEqual([
      '/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2',
    ]);
  });

  it('rejects reorder payloads that do not include every image exactly once', async () => {
    prisma.lot.findUnique.mockResolvedValue({
      id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      status: 'draft',
      sellerProfile: {
        userId: 'user-1',
      },
      lotImages: [
        { id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 },
        { id: '497d0f80-12eb-43c4-931f-816225c92c8b', position: 1 },
      ],
    });

    await expect(
      service.reorderLotImages(createAuth(), '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111', {
        imageIds: ['9cb88056-f0dc-4309-84e4-090af8ace1e2'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reorders lot images in a transaction', async () => {
    prisma.lot.findUnique
      .mockResolvedValueOnce({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        status: 'draft',
        sellerProfile: {
          userId: 'user-1',
        },
        lotImages: [
          { id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 0 },
          { id: '497d0f80-12eb-43c4-931f-816225c92c8b', position: 1 },
        ],
      })
      .mockResolvedValueOnce({
        id: '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
        sellerProfileId: '8b6b2d28-6ad7-4e75-844d-7d3b3e5f5711',
        categoryId: 'b8d7d079-f07e-4cd0-b1e2-1f3a8c1d8f5b',
        title: 'Lot',
        description: 'Description',
        condition: 'excellent',
        lotImages: [
          { id: '497d0f80-12eb-43c4-931f-816225c92c8b', position: 0 },
          { id: '9cb88056-f0dc-4309-84e4-090af8ace1e2', position: 1 },
        ],
        status: 'draft',
        createdAt: new Date('2026-07-13T12:00:00.000Z'),
        updatedAt: new Date('2026-07-13T12:00:00.000Z'),
      });

    const result = await service.reorderLotImages(
      createAuth(),
      '6c9f1dd1-6d40-4b4a-8ef1-8e9b6c0a1111',
      {
        imageIds: [
          '497d0f80-12eb-43c4-931f-816225c92c8b',
          '9cb88056-f0dc-4309-84e4-090af8ace1e2',
        ],
      },
    );

    expect(prisma.lotImage.update).toHaveBeenNthCalledWith(1, {
      where: {
        id: '497d0f80-12eb-43c4-931f-816225c92c8b',
      },
      data: {
        position: 2,
      },
    });
    expect(prisma.lotImage.update).toHaveBeenNthCalledWith(2, {
      where: {
        id: '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      },
      data: {
        position: 3,
      },
    });
    expect(prisma.lotImage.update).toHaveBeenNthCalledWith(3, {
      where: {
        id: '497d0f80-12eb-43c4-931f-816225c92c8b',
      },
      data: {
        position: 0,
      },
    });
    expect(prisma.lotImage.update).toHaveBeenNthCalledWith(4, {
      where: {
        id: '9cb88056-f0dc-4309-84e4-090af8ace1e2',
      },
      data: {
        position: 1,
      },
    });
    expect(result.lot.images).toEqual([
      '/api/images/497d0f80-12eb-43c4-931f-816225c92c8b',
      '/api/images/9cb88056-f0dc-4309-84e4-090af8ace1e2',
    ]);
  });
});
