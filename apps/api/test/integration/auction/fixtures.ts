import { randomUUID } from 'node:crypto';

import { CURRENT_RULES_VERSION } from '@bidplace/contracts';
import { Prisma, type PrismaClient } from '@bidplace/database';
import { expect } from 'vitest';

export type AuctionFixture = {
  seller: { id: string; email: string };
  buyerA: { id: string; email: string };
  buyerB: { id: string; email: string };
  buyerC?: { id: string; email: string };
  product: { id: string; sellerProfileId: string; publicId: string; title: string };
  listing: {
    id: string;
    startsAt: Date;
    originalEndsAt: Date;
    endsAt: Date;
  };
  sellerProfileId: string;
};

export const auctionNow = new Date('2026-08-05T12:00:00.000Z');

async function createBuyer(prisma: PrismaClient, role: string, suffix: string) {
  const email = `${role}.${suffix}@bidplace.test`;
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'auction-fixture',
      displayName: role,
      emailVerifiedAt: auctionNow,
      termsAcceptances: {
        create: {
          rulesVersion: CURRENT_RULES_VERSION,
          acceptedAt: auctionNow,
        },
      },
    },
    select: { id: true, email: true },
  });
}

export async function resetAuctionFixture(prisma: PrismaClient): Promise<void> {
  await prisma.auditEvent.deleteMany();
  await prisma.termsAcceptance.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
  await prisma.phoneVerificationCode.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function createAuctionFixture(
  prisma: PrismaClient,
  options: {
    status?: 'SCHEDULED' | 'LIVE';
    startsAt?: Date;
    originalEndsAt?: Date;
    endsAt?: Date;
    startPrice?: number;
    withBuyerC?: boolean;
    omitHandoff?: boolean;
  } = {},
): Promise<AuctionFixture> {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const startPrice = options.startPrice ?? 10;
  const seller = await prisma.user.create({
    data: {
      email: `seller.${suffix}@bidplace.test`,
      passwordHash: 'auction-fixture',
      displayName: 'Auction seller',
    },
    select: { id: true, email: true },
  });
  const buyerA = await createBuyer(prisma, 'buyer-a', suffix);
  const buyerB = await createBuyer(prisma, 'buyer-b', suffix);
  const buyerC = options.withBuyerC
    ? await createBuyer(prisma, 'buyer-c', suffix)
    : undefined;
  const category = await prisma.category.create({
    data: { slug: `auction-art-${suffix}`, name: 'Auction art' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `auction-seller-${suffix}`,
      sellerType: 'creator',
      fullName: 'Auction Seller',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: Buffer.from([0]),
      socialLink: 'https://example.com/auction',
      shortDescription: 'Auction fixture',
      ...(options.omitHandoff
        ? {}
        : {
            handoffContactType: 'TELEGRAM' as const,
            handoffContactValue: '@auction_seller',
          }),
      status: 'APPROVED',
    },
  });
  const product = await prisma.product.create({
    data: {
      publicId: `aucprod${suffix.slice(0, 4)}`,
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Auction product',
      story: 'Authored auction fixture item.',
      status: 'APPROVED',
    },
    select: { id: true, sellerProfileId: true, publicId: true, title: true },
  });
  const startsAt =
    options.startsAt ?? new Date(auctionNow.getTime() - 3_600_000);
  const originalEndsAt =
    options.originalEndsAt ?? new Date(auctionNow.getTime() + 300_000);
  const endsAt = options.endsAt ?? originalEndsAt;
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      status: options.status ?? 'LIVE',
      startsAt,
      originalEndsAt,
      endsAt,
      currentPrice: new Prisma.Decimal(startPrice),
      auctionRules: {
        create: { startPrice: new Prisma.Decimal(startPrice) },
      },
    },
    select: { id: true, startsAt: true, originalEndsAt: true, endsAt: true },
  });

  return {
    seller,
    buyerA,
    buyerB,
    buyerC,
    product,
    listing,
    sellerProfileId: sellerProfile.id,
  };
}

export async function assertListingBidInvariants(
  prisma: PrismaClient,
  listingId: string,
): Promise<void> {
  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    include: { auctionRules: true },
  });
  const bids = await prisma.bid.findMany({ where: { listingId } });
  const maxAmount =
    bids.length === 0
      ? null
      : bids.reduce(
          (max, bid) => (bid.amount.greaterThan(max) ? bid.amount : max),
          bids[0]!.amount,
        );

  expect(listing.bidCount).toBe(bids.length);
  if (maxAmount) {
    expect(listing.currentPrice.toString()).toBe(maxAmount.toString());
  } else {
    expect(listing.auctionRules).not.toBeNull();
    expect(listing.currentPrice.toString()).toBe(
      listing.auctionRules!.startPrice.toString(),
    );
  }
}
