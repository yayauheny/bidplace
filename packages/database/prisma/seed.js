const { Prisma, PrismaClient } = require('@bidplace/database');

const prisma = new PrismaClient();
const money = (value) => new Prisma.Decimal(value);

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to create the deterministic local/test admin.`);
  }
  return value;
}

async function createProductWithImages({ publicId, sellerProfileId, categoryId, title, city }) {
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
      status: 'APPROVED',
      images: {
        create: [0, 1, 2].map((position) => ({
          position,
          mimeType: 'image/png',
          byteLength: 1,
          data: Buffer.from([position]),
          checksum: `${String(position).repeat(64)}`,
        })),
      },
    },
  });
}

async function main() {
  const adminEmail = requiredEnvironment('SEED_ADMIN_EMAIL');
  const adminPasswordHash = requiredEnvironment('SEED_ADMIN_PASSWORD_HASH');

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
    data: { slug: 'art-object', name: 'Art object', description: 'Local verification category.' },
  });
  const [admin, seller, buyer] = await Promise.all([
    prisma.user.create({ data: { email: adminEmail, passwordHash: adminPasswordHash, phone: '+375290000001', displayName: 'Local Admin', role: 'admin', phoneVerifiedAt: new Date('2026-01-01T00:00:00.000Z') } }),
    prisma.user.create({ data: { email: 'seller@bidplace.test', passwordHash: adminPasswordHash, phone: '+375290000002', displayName: 'Local Seller', phoneVerifiedAt: new Date('2026-01-01T00:00:00.000Z') } }),
    prisma.user.create({ data: { email: 'buyer@bidplace.test', passwordHash: adminPasswordHash, phone: '+375290000003', displayName: 'Local Buyer', phoneVerifiedAt: new Date('2026-01-01T00:00:00.000Z') } }),
  ]);
  void admin;

  const sellerProfile = await prisma.sellerProfile.create({
    data: { userId: seller.id, slug: 'local-seller', sellerType: 'creator', storeName: 'Local Seller', country: 'BY', contactPreference: 'telegram', status: 'APPROVED' },
  });
  const [scheduledProduct, liveProduct, endedProduct] = await Promise.all([
    createProductWithImages({ publicId: 'seedSched01', sellerProfileId: sellerProfile.id, categoryId: category.id, title: 'Scheduled seed product', city: 'Minsk' }),
    createProductWithImages({ publicId: 'seedLive002', sellerProfileId: sellerProfile.id, categoryId: category.id, title: 'Live seed product', city: 'Minsk' }),
    createProductWithImages({ publicId: 'seedEnded3', sellerProfileId: sellerProfile.id, categoryId: category.id, title: 'Ended seed product', city: 'Minsk' }),
  ]);
  const now = new Date();
  const scheduled = await prisma.listing.create({ data: { productId: scheduledProduct.id, status: 'SCHEDULED', startsAt: new Date(now.getTime() + 3_600_000), originalEndsAt: new Date(now.getTime() + 7_200_000), endsAt: new Date(now.getTime() + 7_200_000), currentPrice: money('50.00'), auctionRules: { create: { startPrice: money('50.00') } } } });
  const live = await prisma.listing.create({ data: { productId: liveProduct.id, status: 'LIVE', startsAt: new Date(now.getTime() - 3_600_000), originalEndsAt: new Date(now.getTime() + 3_600_000), endsAt: new Date(now.getTime() + 3_600_000), currentPrice: money('75.00'), bidCount: 1, auctionRules: { create: { startPrice: money('50.00') } } } });
  const ended = await prisma.listing.create({ data: { productId: endedProduct.id, status: 'ENDED', startsAt: new Date(now.getTime() - 7_200_000), originalEndsAt: new Date(now.getTime() - 3_600_000), endsAt: new Date(now.getTime() - 3_600_000), closedAt: new Date(now.getTime() - 3_600_000), currentPrice: money('120.00'), bidCount: 1, auctionRules: { create: { startPrice: money('100.00') } } } });
  const liveBid = await prisma.bid.create({ data: { listingId: live.id, bidderUserId: buyer.id, idempotencyKey: 'seed-live-bid', amount: money('75.00') } });
  void liveBid;
  const endedBid = await prisma.bid.create({ data: { listingId: ended.id, bidderUserId: buyer.id, idempotencyKey: 'seed-ended-bid', amount: money('120.00') } });
  await prisma.order.create({ data: { publicId: 'seedOrder01', listingId: ended.id, sellerId: seller.id, buyerId: buyer.id, sourceBidId: endedBid.id, finalAmount: money('120.00'), contactDueAt: new Date(now.getTime() + 82_800_000) } });
  void scheduled;
  console.log('Seeded deterministic local/test admin plus scheduled, live, and ended Product Listings in BYN.');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
