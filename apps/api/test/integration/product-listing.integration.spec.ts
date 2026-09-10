import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { CURRENT_RULES_VERSION } from '@bidplace/contracts';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;

async function reset() {
  await prisma.phoneVerificationCode.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.curatorSelection.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function fixture() {
  const suffix = randomUUID();
  const seller = await prisma.user.create({
    data: {
      email: `seller.${suffix}@bidplace.test`,
      passwordHash: 'test',
      displayName: 'Seller',
    },
  });
  const buyer = await prisma.user.create({
    data: {
      email: `buyer.${suffix}@bidplace.test`,
      passwordHash: 'test',
      displayName: 'Buyer',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.termsAcceptance.create({
    data: {
      userId: buyer.id,
      rulesVersion: CURRENT_RULES_VERSION,
      acceptedAt: new Date(),
    },
  });
  const category = await prisma.category.create({
    data: { slug: `art-${suffix}`, name: 'Art' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `seller-${suffix}`,
      sellerType: 'creator',
      fullName: 'Seller',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: Buffer.from([0]),
      socialLink: 'https://example.com/seller',
      shortDescription: 'Seller profile for integration tests',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@seller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });
  const product = await prisma.product.create({
    data: {
      publicId: randomUUID().replace(/-/g, '').slice(0, 11),
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Product',
      story: 'Story',
      status: 'APPROVED',
    },
  });
  return { seller, buyer, product };
}

function listingData(productId: string, status: 'SCHEDULED' | 'LIVE' | 'ENDED') {
  const startsAt = new Date('2026-07-18T10:00:00.000Z');
  const endsAt = new Date('2026-07-18T12:00:00.000Z');
  return {
    productId,
    status,
    startsAt,
    originalEndsAt: endsAt,
    endsAt,
    currentPrice: new Prisma.Decimal(10),
    auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
  };
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});
afterEach(reset);
afterAll(async () => context?.cleanup());

describe('Product / Listing PostgreSQL invariants', () => {
  it('allows only one scheduled or live Listing for a Product', async () => {
    const { product } = await fixture();
    await prisma.listing.create({ data: listingData(product.id, 'SCHEDULED') });

    await expect(
      prisma.listing.create({ data: listingData(product.id, 'LIVE') }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows only one non-cancelled Order for a Listing', async () => {
    const { seller, buyer, product } = await fixture();
    const listing = await prisma.listing.create({
      data: listingData(product.id, 'ENDED'),
    });
    const firstBid = await prisma.bid.create({
      data: {
        listingId: listing.id,
        bidderUserId: buyer.id,
        idempotencyKey: 'first',
        amount: new Prisma.Decimal(10),
      },
    });
    const secondBid = await prisma.bid.create({
      data: {
        listingId: listing.id,
        bidderUserId: seller.id,
        idempotencyKey: 'second',
        amount: new Prisma.Decimal(11),
      },
    });
    await prisma.order.create({
      data: {
        publicId: 'orderPublic1',
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        sourceBidId: firstBid.id,
        finalAmount: firstBid.amount,
        contactDueAt: new Date(),
        sellerHandoffType: 'TELEGRAM',
        sellerHandoffValue: '@seller',
        buyerEmailAtClose: buyer.email,
        handoffInitiator: 'BUYER_CONTACTS_SELLER',
      },
    });

    await expect(
      prisma.order.create({
        data: {
          publicId: 'orderPublic2',
          listingId: listing.id,
          sellerId: seller.id,
          buyerId: seller.id,
          sourceBidId: secondBid.id,
          finalAmount: secondBid.amount,
          contactDueAt: new Date(),
          sellerHandoffType: 'TELEGRAM',
          sellerHandoffValue: '@seller',
          buyerEmailAtClose: buyer.email,
          handoffInitiator: 'BUYER_CONTACTS_SELLER',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('enforces bidder idempotency across Listing requests', async () => {
    const { buyer, product } = await fixture();
    const first = await prisma.listing.create({
      data: listingData(product.id, 'ENDED'),
    });
    const anotherProduct = await prisma.product.create({
      data: {
        publicId: randomUUID().replace(/-/g, '').slice(0, 11),
        sellerProfileId: product.sellerProfileId,
        title: 'Other',
        status: 'DRAFT',
      },
    });
    const second = await prisma.listing.create({
      data: listingData(anotherProduct.id, 'ENDED'),
    });
    await prisma.bid.create({
      data: {
        listingId: first.id,
        bidderUserId: buyer.id,
        idempotencyKey: 'same-key',
        amount: new Prisma.Decimal(10),
      },
    });

    await expect(
      prisma.bid.create({
        data: {
          listingId: second.id,
          bidderUserId: buyer.id,
          idempotencyKey: 'same-key',
          amount: new Prisma.Decimal(11),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
