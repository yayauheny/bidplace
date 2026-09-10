import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

import { imageKey } from './image-key';
import { PostgresImageStore } from './postgres-image-store';

describe('PostgresImageStore', () => {
  const prisma = {
    productImage: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    productCreationStep: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    sellerProfile: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    sellerProfileRevision: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    sellerProfileRevisionAchievement: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  let store: PostgresImageStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new PostgresImageStore(prisma as never);
  });

  it('maps product-image keys to ProductImage updates', async () => {
    const bytes = Uint8Array.from([1, 2, 3]);

    await store.put(imageKey.productImage('image-id'), {
      bytes,
      mimeType: 'image/png',
    });

    expect(prisma.productImage.update).toHaveBeenCalledWith({
      where: { id: 'image-id' },
      data: {
        data: bytes,
        mimeType: 'image/png',
      },
    });
  });

  it('maps seller-photo keys to SellerProfile photo columns', async () => {
    const bytes = Uint8Array.from([4, 5, 6]);

    await store.put(imageKey.sellerPhoto('seller-id'), {
      bytes,
      mimeType: 'image/jpeg',
    });

    expect(prisma.sellerProfile.update).toHaveBeenCalledWith({
      where: { id: 'seller-id' },
      data: {
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoData: bytes,
      },
    });
  });

  it('stores revision and achievement bytes with mime, length and checksum', async () => {
    const bytes = Uint8Array.from([9, 8, 7]);
    const checksum = createHash('sha256').update(bytes).digest('hex');

    await store.put(imageKey.sellerProfileRevision('revision-id'), {
      bytes,
      mimeType: 'image/png',
    });
    await store.put(imageKey.sellerAchievement('achievement-id'), {
      bytes,
      mimeType: 'image/jpeg',
    });

    expect(prisma.sellerProfileRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-id' },
      data: {
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 3,
        profilePhotoChecksum: checksum,
        profilePhotoData: bytes,
      },
    });
    expect(prisma.sellerProfileRevisionAchievement.update).toHaveBeenCalledWith({
      where: { id: 'achievement-id' },
      data: {
        mimeType: 'image/jpeg',
        byteLength: 3,
        checksum,
        data: bytes,
      },
    });
  });

  it('replaces revision photo bytes on a second put', async () => {
    const first = Uint8Array.from([1, 2]);
    const second = Uint8Array.from([3, 4, 5]);

    await store.put(imageKey.sellerProfileRevision('revision-id'), {
      bytes: first,
      mimeType: 'image/png',
    });
    await store.put(imageKey.sellerProfileRevision('revision-id'), {
      bytes: second,
      mimeType: 'image/jpeg',
    });

    expect(prisma.sellerProfileRevision.update).toHaveBeenLastCalledWith({
      where: { id: 'revision-id' },
      data: {
        profilePhotoMimeType: 'image/jpeg',
        profilePhotoByteLength: 3,
        profilePhotoChecksum: createHash('sha256').update(second).digest('hex'),
        profilePhotoData: second,
      },
    });
  });

  it('reads product-image bytes from ProductImage', async () => {
    prisma.productImage.findUnique.mockResolvedValue({
      data: Uint8Array.from([7, 8]),
      mimeType: 'image/png',
    });

    const result = await store.get(imageKey.productImage('image-id'));

    expect(result).toEqual({
      bytes: Uint8Array.from([7, 8]),
      mimeType: 'image/png',
    });
  });

  it('reads revision and achievement bytes', async () => {
    prisma.sellerProfileRevision.findUnique.mockResolvedValue({
      profilePhotoData: Uint8Array.from([1, 2]),
      profilePhotoMimeType: 'image/png',
    });
    prisma.sellerProfileRevisionAchievement.findUnique.mockResolvedValue({
      data: Uint8Array.from([3, 4]),
      mimeType: 'image/jpeg',
    });

    await expect(
      store.get(imageKey.sellerProfileRevision('revision-id')),
    ).resolves.toEqual({
      bytes: Uint8Array.from([1, 2]),
      mimeType: 'image/png',
    });
    await expect(
      store.get(imageKey.sellerAchievement('achievement-id')),
    ).resolves.toEqual({
      bytes: Uint8Array.from([3, 4]),
      mimeType: 'image/jpeg',
    });
  });

  it('clears nullable creation-step image fields on delete', async () => {
    await store.delete(imageKey.creationStep('step-id'));

    expect(prisma.productCreationStep.update).toHaveBeenCalledWith({
      where: { id: 'step-id' },
      data: {
        mimeType: null,
        byteLength: null,
        data: null,
        checksum: null,
        width: null,
        height: null,
      },
    });
  });

  it('clears revision photo bytes and no-ops missing achievement rows', async () => {
    prisma.sellerProfileRevisionAchievement.findUnique.mockResolvedValue(null);

    await store.delete(imageKey.sellerProfileRevision('revision-id'));
    await store.delete(imageKey.sellerAchievement('missing-id'));

    expect(prisma.sellerProfileRevision.update).toHaveBeenCalledWith({
      where: { id: 'revision-id' },
      data: {
        profilePhotoMimeType: null,
        profilePhotoByteLength: null,
        profilePhotoChecksum: null,
        profilePhotoData: null,
      },
    });
    expect(prisma.sellerProfileRevisionAchievement.update).not.toHaveBeenCalled();
  });
});
