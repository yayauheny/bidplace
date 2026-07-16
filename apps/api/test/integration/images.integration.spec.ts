import { randomUUID } from 'node:crypto';

import { type AuthTokenPayload } from '@bidplace/contracts';
import { PrismaClient } from '@bidplace/database';
import { NotFoundException } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { lotContractSelect } from '../../src/lots/lot.mapper';
import { ImagesService } from '../../src/images/images.service';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x00,
]);

let prisma: PrismaClient;
let imagesService: ImagesService;
let integrationDatabaseContext: IntegrationDatabaseContext;

async function resetDatabase() {
  await prisma.auction.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(displayName: string, role: 'user' | 'admin' = 'user') {
  const suffix = randomUUID();

  return prisma.user.create({
    data: {
      email: `${displayName}.${suffix}@bidplace.test`,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo$hash',
      phone: `+1555${suffix.slice(0, 8)}`,
      displayName,
      role,
    },
  });
}

async function createSellerFixture() {
  const seller = await createUser('Seller');
  const viewer = await createUser('Viewer');
  const admin = await createUser('Admin', 'admin');

  const category = await prisma.category.create({
    data: {
      slug: `art-object-${randomUUID()}`,
      name: 'Art Object',
      description: 'Integration test category',
    },
  });

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `seller-${randomUUID()}`,
      sellerType: 'creator',
      storeName: 'Test Store',
      country: 'BY',
      contactPreference: 'telegram',
      status: 'active',
    },
  });

  return {
    seller,
    viewer,
    admin,
    category,
    sellerProfile,
  };
}

async function createLotWithImages(options: {
  sellerProfileId: string;
  categoryId: string;
  status?: 'draft' | 'published';
  imageCount?: number;
}) {
  return prisma.lot.create({
    data: {
      sellerProfileId: options.sellerProfileId,
      categoryId: options.categoryId,
      title: `Lot ${randomUUID()}`,
      description: 'Integration test lot',
      condition: 'excellent',
      status: options.status ?? 'draft',
      lotImages: {
        create: Array.from({ length: options.imageCount ?? 3 }, (_, index) => ({
          position: index,
          mimeType: 'image/png',
          byteLength: pngBuffer.byteLength,
          data: Uint8Array.from(pngBuffer),
          checksum: `checksum-${index}-${randomUUID()}`,
        })),
      },
    },
    select: lotContractSelect,
  });
}

function createAuth(
  userId: string,
  role: 'user' | 'admin' = 'user',
): AuthTokenPayload {
  return {
    sub: userId,
    email: `${userId}@bidplace.test`,
    role,
    sessionVersion: 1,
    iat: 1,
    exp: 2,
  };
}

beforeAll(async () => {
  integrationDatabaseContext = await createIntegrationDatabaseContext();
  prisma = integrationDatabaseContext.prisma;
  imagesService = new ImagesService(prisma);
});

afterEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await integrationDatabaseContext.cleanup();
});

describe('image management integration', () => {
  it('keeps draft images private while allowing owners and admins to read them', async () => {
    const { seller, admin, category, sellerProfile } = await createSellerFixture();
    const lot = await createLotWithImages({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      status: 'draft',
      imageCount: 1,
    });
    const imageId = lot.lotImages[0]?.id;

    expect(imageId).toBeDefined();

    await expect(imagesService.getImage(imageId!)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const ownerImage = await imagesService.getImage(imageId!, createAuth(seller.id));
    const adminImage = await imagesService.getImage(
      imageId!,
      createAuth(admin.id, 'admin'),
    );

    expect(ownerImage.isPublic).toBe(false);
    expect(adminImage.isPublic).toBe(false);
    expect(ownerImage.byteLength).toBe(pngBuffer.byteLength);
  });

  it('deletes images without leaving orphan rows and compacts positions', async () => {
    const { seller, category, sellerProfile } = await createSellerFixture();
    const lot = await createLotWithImages({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
    });
    const imageIds = lot.lotImages.map((image) => image.id);

    const response = await imagesService.deleteLotImage(
      createAuth(seller.id),
      lot.id,
      imageIds[1]!,
    );

    const remainingImages = await prisma.lotImage.findMany({
      where: {
        lotId: lot.id,
      },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });

    expect(response.lot.images).toEqual([
      `/api/images/${imageIds[0]}`,
      `/api/images/${imageIds[2]}`,
    ]);
    expect(remainingImages.map((image) => image.id)).toEqual([
      imageIds[0],
      imageIds[2],
    ]);
    expect(remainingImages.map((image) => image.position)).toEqual([0, 1]);
    expect(
      await prisma.lotImage.findUnique({
        where: {
          id: imageIds[1]!,
        },
      }),
    ).toBeNull();
  });

  it('reorders lot images while keeping lot projections free of binary payloads', async () => {
    const { seller, category, sellerProfile } = await createSellerFixture();
    const lot = await createLotWithImages({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
    });
    const reversedImageIds = lot.lotImages.map((image) => image.id).reverse();

    const response = await imagesService.reorderLotImages(
      createAuth(seller.id),
      lot.id,
      {
        imageIds: reversedImageIds,
      },
    );
    const lotProjection = await prisma.lot.findUnique({
      where: {
        id: lot.id,
      },
      select: lotContractSelect,
    });

    expect(response.lot.images).toEqual(
      reversedImageIds.map((imageId) => `/api/images/${imageId}`),
    );
    expect(lotProjection?.lotImages.map((image) => image.id)).toEqual(reversedImageIds);
    expect('data' in (lotProjection?.lotImages[0] ?? {})).toBe(false);
  });

  it('removes lot images through cascade delete when the lot is deleted', async () => {
    const { category, sellerProfile } = await createSellerFixture();
    const lot = await createLotWithImages({
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      imageCount: 2,
    });
    const imageIds = lot.lotImages.map((image) => image.id);

    await prisma.lot.delete({
      where: {
        id: lot.id,
      },
    });

    const remainingImages = await prisma.lotImage.findMany({
      where: {
        id: {
          in: imageIds,
        },
      },
    });

    expect(remainingImages).toHaveLength(0);
  });
});
