import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ProductsService } from '../../src/products/products.service';
import { SellersService } from '../../src/sellers/sellers.service';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

async function reset() {
  await prisma.product.updateMany({
    data: { editingRevisionId: null, publishedRevisionId: null },
  });
  await prisma.productRevision.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

describe('Public seller pagination PostgreSQL behavior', () => {
  beforeAll(async () => {
    context = await createIntegrationDatabaseContext();
    prisma = context.prisma;
  });

  afterEach(reset);
  afterAll(async () => {
    await context?.cleanup();
  });

  it('filters and paginates in PostgreSQL while returning image metadata only', async () => {
    const suffix = randomUUID();
    const user = await prisma.user.create({
      data: {
        email: `seller.${suffix}@bidplace.test`,
        passwordHash: 'test',
        displayName: 'Seller',
      },
    });
    const profile = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        slug: `seller-${suffix}`,
        sellerType: 'creator',
        fullName: 'Seller',
        country: 'BY',
        city: 'Minsk',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 1,
        profilePhotoChecksum: '0'.repeat(64),
        profilePhotoData: Buffer.from([0]),
        socialLink: 'https://example.com/seller',
        shortDescription: 'Seller profile for pagination tests',
        handoffContactType: 'TELEGRAM',
        handoffContactValue: '@seller',
        status: 'APPROVED',
      },
    });
    const category = await prisma.category.create({
      data: {
        slug: `pagination-${suffix}`,
        name: 'Pagination category',
      },
    });
    const now = new Date('2026-08-12T10:00:00.000Z');
    const products = await Promise.all(
      ['First', 'Second'].map(async (title, index) => {
        const product = await prisma.product.create({
          data: {
            publicId: `${suffix.replace(/-/g, '').slice(0, 10)}${index}`,
            sellerProfileId: profile.id,
            categoryId: category.id,
            title,
            story: 'Story',
            uniqueness: 'One',
            provenance: 'Created by the seller',
            city: 'Minsk',
            deliveryInfo: 'Pickup',
            status: 'APPROVED',
            publishedAt: now,
            createdAt: new Date(now.getTime() + index * 1_000),
            images: {
              create: {
                position: 0,
                mimeType: 'image/png',
                byteLength: 4,
                data: Buffer.from([1, 2, 3, 4]),
                checksum: '1'.repeat(64),
              },
            },
            listings: {
              create: {
                status: 'LIVE',
                startsAt: now,
                originalEndsAt: new Date(now.getTime() + 86_400_000),
                endsAt: new Date(now.getTime() + 86_400_000),
                currentPrice: new Prisma.Decimal(10 + index),
                auctionRules: {
                  create: { startPrice: new Prisma.Decimal(10) },
                },
              },
            },
          },
          include: { images: { select: { id: true } } },
        });
        const revision = await prisma.productRevision.create({
          data: {
            productId: product.id,
            version: 1,
            status: 'APPROVED',
            categoryId: category.id,
            title,
            story: 'Story',
            uniqueness: 'One',
            provenance: 'Created by the seller',
            city: 'Minsk',
            deliveryInfo: 'Pickup',
            images: {
              create: {
                imageId: product.images[0]!.id,
                position: 0,
              },
            },
          },
        });
        return prisma.product.update({
          where: { id: product.id },
          data: {
            editingRevisionId: revision.id,
            publishedRevisionId: revision.id,
          },
        });
      }),
    );
    const service = new SellersService(
      prisma as never,
      new ProductsService(prisma as never, {} as never),
    );

    const firstPage = await service.getPublic(profile.slug, {
      page: 1,
      limit: 1,
      sort: 'newest',
    });
    const secondPage = await service.getPublic(profile.slug, {
      page: 2,
      limit: 1,
      sort: 'newest',
    });

    expect(firstPage.pagination).toEqual({ page: 1, limit: 1, total: 2 });
    expect(secondPage.pagination).toEqual({ page: 2, limit: 1, total: 2 });
    expect(firstPage.products[0]?.product.publicId).toBe(products[1]?.publicId);
    expect(secondPage.products[0]?.product.publicId).toBe(
      products[0]?.publicId,
    );
    expect(firstPage.statusCounts).toEqual({ SCHEDULED: 0, LIVE: 2, ENDED: 0 });
    expect(firstPage.products[0]?.product.images[0]).toMatchObject({
      mimeType: 'image/png',
      byteLength: 4,
    });
    expect(firstPage.products[0]?.product.images[0]).not.toHaveProperty('data');
  });
});
