const { Prisma, PrismaClient } = require('../dist');
const { createHash } = require('node:crypto');

if (
  process.env.NODE_ENV === 'production' ||
  process.env.ALLOW_DESTRUCTIVE_DEMO_SEED !== 'true'
) {
  throw new Error(
    'Refusing to run destructive seed in production or without ALLOW_DESTRUCTIVE_DEMO_SEED=true',
  );
}

const prisma = new PrismaClient();
const money = (value) => new Prisma.Decimal(value);
const seedPhotoBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0nM9sAAAAASUVORK5CYII=',
  'base64',
);

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required to create the deterministic local/test admin.`,
    );
  }
  return value;
}

async function createProductWithImages({
  publicId,
  sellerProfileId,
  categoryId,
  title,
  city,
  publishedAt,
}) {
  return prisma.product.create({
    data: {
      publicId,
      sellerProfileId,
      categoryId,
      title,
      story: 'A small reproducible local fixture used only to verify Product and Listing states.',
      condition: 'excellent',
      uniqueness: 'One original physical item.',
      provenance: 'Created and offered directly by the approved seller.',
      city,
      deliveryInfo: 'Pickup or delivery is arranged after the Order is created.',
      publishedAt,
      status: 'APPROVED',
      images: {
        create: [
          {
            position: 0,
            mimeType: 'image/png',
            byteLength: 1,
            data: Buffer.from([0]),
            checksum: '0'.repeat(64),
          },
        ],
      },
    },
  });
}

async function main() {
  const adminEmail = requiredEnvironment('SEED_ADMIN_EMAIL');
  const adminPasswordHash = requiredEnvironment('SEED_ADMIN_PASSWORD_HASH');

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

  const category = await prisma.category.create({
    data: {
      slug: 'art-object',
      name: 'Art object',
      description: 'Local verification category.',
    },
  });

  const [admin, seller, buyer] = await Promise.all([
    prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        phone: '+375290000001',
        displayName: 'Local Admin',
        role: 'admin',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller@bidplace.test',
        passwordHash: adminPasswordHash,
        phone: null,
        displayName: 'Local Seller',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer@bidplace.test',
        passwordHash: adminPasswordHash,
        phone: null,
        displayName: 'Local Buyer',
        emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    }),
  ]);

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: 'local-seller',
      sellerType: 'creator',
      fullName: 'Local Seller',
      country: 'BY',
      socialLink: 'https://example.com/local-seller',
      shortDescription: 'Local deterministic seller profile used for reset and smoke testing.',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: seedPhotoBuffer.byteLength,
      profilePhotoChecksum: createHash('sha256').update(seedPhotoBuffer).digest('hex'),
      profilePhotoData: seedPhotoBuffer,
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@localseller',
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
      status: 'APPROVED',
    },
  });

  const now = new Date();
  const [scheduledProduct, liveProduct, endedProduct] = await Promise.all([
    createProductWithImages({
      publicId: 'seedSched01',
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Scheduled seed product',
      city: 'Minsk',
      publishedAt: now,
    }),
    createProductWithImages({
      publicId: 'seedLive002',
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Live seed product',
      city: 'Minsk',
      publishedAt: now,
    }),
    createProductWithImages({
      publicId: 'seedEnded03',
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Ended seed product',
      city: 'Minsk',
      publishedAt: now,
    }),
  ]);

  const scheduled = await prisma.listing.create({
    data: {
      productId: scheduledProduct.id,
      status: 'SCHEDULED',
      startsAt: new Date(now.getTime() + 3_600_000),
      originalEndsAt: new Date(now.getTime() + 7_200_000),
      endsAt: new Date(now.getTime() + 7_200_000),
      currentPrice: money('50.00'),
      auctionRules: {
        create: { startPrice: money('50.00') },
      },
    },
  });

  const live = await prisma.listing.create({
    data: {
      productId: liveProduct.id,
      status: 'LIVE',
      startsAt: new Date(now.getTime() - 3_600_000),
      originalEndsAt: new Date(now.getTime() + 3_600_000),
      endsAt: new Date(now.getTime() + 3_600_000),
      currentPrice: money('75.00'),
      bidCount: 1,
      auctionRules: {
        create: { startPrice: money('50.00') },
      },
    },
  });

  const ended = await prisma.listing.create({
    data: {
      productId: endedProduct.id,
      status: 'ENDED',
      startsAt: new Date(now.getTime() - 7_200_000),
      originalEndsAt: new Date(now.getTime() - 3_600_000),
      endsAt: new Date(now.getTime() - 3_600_000),
      closedAt: new Date(now.getTime() - 3_600_000),
      currentPrice: money('120.00'),
      bidCount: 1,
      auctionRules: {
        create: { startPrice: money('100.00') },
      },
    },
  });

  const liveBid = await prisma.bid.create({
    data: {
      listingId: live.id,
      bidderUserId: buyer.id,
      idempotencyKey: 'seed-live-bid',
      amount: money('75.00'),
    },
  });

  const endedBid = await prisma.bid.create({
    data: {
      listingId: ended.id,
      bidderUserId: buyer.id,
      idempotencyKey: 'seed-ended-bid',
      amount: money('120.00'),
    },
  });

  await prisma.order.create({
    data: {
      publicId: 'seedOrder01',
      listingId: ended.id,
      sellerId: seller.id,
      buyerId: buyer.id,
      sourceBidId: endedBid.id,
      finalAmount: money('120.00'),
      contactDueAt: new Date(now.getTime() + 82_800_000),
      sellerHandoffType: 'TELEGRAM',
      sellerHandoffValue: '@localseller',
      buyerEmailAtClose: buyer.email,
      handoffInitiator: 'BUYER_CONTACTS_SELLER',
    },
  });

  await prisma.termsAcceptance.create({
    data: {
      userId: buyer.id,
      rulesVersion: 'MVP_RULES_V1',
      acceptedAt: new Date(now.getTime() - 60_000),
    },
  });

  void scheduled;
  void liveBid;

  console.log(
    'Seeded deterministic local/test admin, approved seller, email-only buyer, and scheduled/live/ended Product Listings in BYN.',
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
