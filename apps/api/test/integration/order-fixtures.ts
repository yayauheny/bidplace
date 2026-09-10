import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';

export type OrderFixture = {
  admin: { id: string; email: string };
  seller: { id: string; email: string };
  winner: { id: string; email: string };
  nextRanked: { id: string; email: string };
  outsider: { id: string; email: string };
  listing: { id: string };
  winnerBid: { id: string };
  nextRankedBid: { id: string };
  order: { id: string; publicId: string };
  sellerContact: string;
};

const fixtureDate = new Date('2026-08-05T10:00:00.000Z');

function fixtureEmail(role: string, suffix: string): string {
  return `${role}.${suffix}@bidplace.test`;
}

async function createUser(
  prisma: PrismaClient,
  role: string,
  suffix: string,
  userRole: 'admin' | 'user' = 'user',
) {
  const email = fixtureEmail(role, suffix);
  return prisma.user.create({
    data: {
      email,
      passwordHash: 'integration-fixture',
      displayName: role,
      role: userRole,
      emailVerifiedAt: fixtureDate,
    },
    select: { id: true, email: true },
  });
}

export async function resetOrderFixture(prisma: PrismaClient): Promise<void> {
  await prisma.auditEvent.deleteMany();
  await prisma.termsAcceptance.deleteMany();
  await prisma.emailVerificationCode.deleteMany();
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

export async function createOrderFixture(
  prisma: PrismaClient,
  options: {
    handoffInitiator?: 'BUYER_CONTACTS_SELLER' | 'SELLER_CONTACTS_BUYER';
  } = {},
): Promise<OrderFixture> {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
  const seller = await createUser(prisma, 'seller', suffix);
  const winner = await createUser(prisma, 'winner', suffix);
  const nextRanked = await createUser(prisma, 'next', suffix);
  const outsider = await createUser(prisma, 'outsider', suffix);
  const admin = await createUser(prisma, 'admin', suffix, 'admin');
  const sellerContact = `@seller_${suffix}`;

  const category = await prisma.category.create({
    data: { slug: `order-art-${suffix}`, name: 'Order integration art' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: `order-seller-${suffix}`,
      sellerType: 'creator',
      fullName: 'Order Integration Seller',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: 1,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: Buffer.from([0]),
      socialLink: 'https://example.com/order-integration',
      shortDescription: 'Order integration seller',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: sellerContact,
      handoffInitiator: options.handoffInitiator ?? 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });
  const product = await prisma.product.create({
    data: {
      publicId: `ordprod${suffix.slice(0, 4)}`,
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Order integration product',
      story: 'A deterministic authored item for Order integration coverage.',
      status: 'APPROVED',
    },
  });
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      status: 'ENDED',
      startsAt: new Date(fixtureDate.getTime() - 3_600_000),
      originalEndsAt: fixtureDate,
      endsAt: fixtureDate,
      currentPrice: new Prisma.Decimal(200),
      bidCount: 2,
      auctionRules: { create: { startPrice: new Prisma.Decimal(100) } },
    },
    select: { id: true },
  });
  const winnerBid = await prisma.bid.create({
    data: {
      listingId: listing.id,
      bidderUserId: winner.id,
      idempotencyKey: `winner-${suffix}`,
      amount: new Prisma.Decimal(200),
      createdAt: new Date(fixtureDate.getTime() - 2_000),
    },
    select: { id: true },
  });
  const nextRankedBid = await prisma.bid.create({
    data: {
      listingId: listing.id,
      bidderUserId: nextRanked.id,
      idempotencyKey: `next-${suffix}`,
      amount: new Prisma.Decimal(150),
      createdAt: new Date(fixtureDate.getTime() - 1_000),
    },
    select: { id: true },
  });
  const order = await prisma.order.create({
    data: {
      publicId: `ord${suffix.slice(0, 8)}`,
      listingId: listing.id,
      sellerId: seller.id,
      buyerId: winner.id,
      sourceBidId: winnerBid.id,
      finalAmount: new Prisma.Decimal(200),
      contactDueAt: new Date(fixtureDate.getTime() + 86_400_000),
      sellerHandoffType: 'TELEGRAM',
      sellerHandoffValue: sellerContact,
      buyerEmailAtClose: winner.email,
      handoffInitiator: options.handoffInitiator ?? 'BUYER_CONTACTS_SELLER',
    },
    select: { id: true, publicId: true },
  });

  return {
    admin,
    seller,
    winner,
    nextRanked,
    outsider,
    listing,
    winnerBid,
    nextRankedBid,
    order,
    sellerContact,
  };
}
