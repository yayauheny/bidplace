import { beforeEach, describe, expect, it, vi } from 'vitest';

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
});
