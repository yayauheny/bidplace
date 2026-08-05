import { randomUUID } from 'node:crypto';

import { CURRENT_RULES_VERSION } from '@bidplace/contracts';
import { Prisma, type PrismaClient } from '@bidplace/database';

export type AuctionIntegrityFixture = {
  seller: { id: string; email: string };
  buyerA: { id: string; email: string };
  buyerB: { id: string; email: string };
  product: { id: string };
  listing: {
    id: string;
    startsAt: Date;
    originalEndsAt: Date;
    endsAt: Date;
  };
};

export const fixtureNow = new Date('2026-08-05T12:00:00.000Z');

async function createBuyer(prisma: PrismaClient, role: string, suffix: string) {
  const email = `${role}.${suffix}@bidplace.test`;
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'auction-integrity-fixture',
      displayName: role,
      emailVerifiedAt: fixtureNow,
      termsAcceptances: {
        create: {
          rulesVersion: CURRENT_RULES_VERSION,
          acceptedAt: fixtureNow,
        },
      },
    },
    select: { id: true, email: true },
  });
}

export async function resetAuctionIntegrityFixture(
  prisma: PrismaClient,
): Promise<void> {
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

export async function createAuctionIntegrityFixture(
  prisma: PrismaClient,
  options: {
    status?: 'SCHEDULED' | 'LIVE';
    startsAt?: Date;
    originalEndsAt?: Date;
    endsAt?: Date;
    startPrice?: number;
  } = {},
): Promise<AuctionIntegrityFixture> {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const seller = await prisma.user.create({
    data: {
      email: `seller.${suffix}@bidplace.test`,
      passwordHash: 'auction-integrity-fixture',
      displayName: 'Auction seller',
    },
    select: { id: true, email: true },
  });
  const buyerA = await createBuyer(prisma, 'buyer-a', suffix);
  const buyerB = await createBuyer(prisma, 'buyer-b', suffix);
  const category = await prisma.category.create({
    data: { slug: `auction-art-${suffix}`, name: 'Auction integrity art' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `auction-seller-${suffix}`,
      sellerType: 'creator',
      fullName: 'Auction Integrity Seller',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: Buffer.from([0]),
      socialLink: 'https://example.com/auction-integrity',
      shortDescription: 'Auction integrity fixture',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@auction_integrity_seller',
      status: 'APPROVED',
    },
  });
  const product = await prisma.product.create({
    data: {
      publicId: `aucprod${suffix.slice(0, 4)}`,
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Auction integrity product',
      story: 'A deterministic authored item for auction integrity coverage.',
      status: 'APPROVED',
    },
    select: { id: true },
  });
  const startsAt =
    options.startsAt ?? new Date(fixtureNow.getTime() - 3_600_000);
  const originalEndsAt =
    options.originalEndsAt ?? new Date(fixtureNow.getTime() + 300_000);
  const endsAt = options.endsAt ?? originalEndsAt;
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      status: options.status ?? 'LIVE',
      startsAt,
      originalEndsAt,
      endsAt,
      currentPrice: new Prisma.Decimal(options.startPrice ?? 10),
      auctionRules: {
        create: { startPrice: new Prisma.Decimal(options.startPrice ?? 10) },
      },
    },
    select: { id: true, startsAt: true, originalEndsAt: true, endsAt: true },
  });

  return { seller, buyerA, buyerB, product, listing };
}
