const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const category = await prisma.category.create({
    data: {
      slug: 'art-object',
      name: 'Art Object',
      description: 'Curated art and collectible pieces for MVP demos.',
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: 'seller@bidplace.test',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo$hash',
      phone: '+15555550100',
      displayName: 'Demo Seller',
      role: 'user',
    },
  });

  const buyerOne = await prisma.user.create({
    data: {
      email: 'buyer-one@bidplace.test',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo$hash',
      phone: '+15555550101',
      displayName: 'Buyer One',
      role: 'user',
    },
  });

  const buyerTwo = await prisma.user.create({
    data: {
      email: 'buyer-two@bidplace.test',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$demo$hash',
      phone: '+15555550102',
      displayName: 'Buyer Two',
      role: 'user',
    },
  });

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      slug: 'demo-seller',
      sellerType: 'creator',
      storeName: 'Demo Store',
      country: 'BY',
      contactPreference: 'telegram',
      socialLink: 'https://example.com/demo-store',
      shortDescription: 'Demo seller profile for local development.',
      status: 'active',
    },
  });

  const activeLot = await prisma.lot.create({
    data: {
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Signed Ceramic Vase',
      description: 'Handmade ceramic vase from the MVP seed data set.',
      condition: 'excellent',
      images: ['https://example.com/images/vase-1.jpg'],
      status: 'published',
    },
  });

  const activeAuction = await prisma.auction.create({
    data: {
      lotId: activeLot.id,
      sellerProfileId: sellerProfile.id,
      slug: 'demo-active-auction',
      startPrice: new Prisma.Decimal('100.00'),
      reservePrice: new Prisma.Decimal('150.00'),
      currentPrice: new Prisma.Decimal('120.00'),
      currency: 'USD',
      bidStep: new Prisma.Decimal('5.00'),
      startsAt: new Date('2026-07-12T10:00:00.000Z'),
      endsAt: new Date('2026-07-16T10:00:00.000Z'),
      status: 'active',
      bidCount: 2,
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: activeAuction.id,
      bidderUserId: buyerOne.id,
      amount: new Prisma.Decimal('110.00'),
      status: 'outbid',
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: activeAuction.id,
      bidderUserId: buyerTwo.id,
      amount: new Prisma.Decimal('120.00'),
      status: 'winning',
    },
  });

  const soldLot = await prisma.lot.create({
    data: {
      sellerProfileId: sellerProfile.id,
      categoryId: category.id,
      title: 'Framed Limited Print',
      description: 'Limited print used for the finished-auction seed.',
      condition: 'good',
      images: ['https://example.com/images/print-1.jpg'],
      status: 'published',
    },
  });

  const soldAuction = await prisma.auction.create({
    data: {
      lotId: soldLot.id,
      sellerProfileId: sellerProfile.id,
      slug: 'demo-sold-auction',
      startPrice: new Prisma.Decimal('200.00'),
      reservePrice: new Prisma.Decimal('240.00'),
      currentPrice: new Prisma.Decimal('260.00'),
      currency: 'USD',
      bidStep: new Prisma.Decimal('10.00'),
      startsAt: new Date('2026-07-10T10:00:00.000Z'),
      endsAt: new Date('2026-07-11T10:00:00.000Z'),
      status: 'sold',
      bidCount: 3,
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: soldAuction.id,
      bidderUserId: buyerOne.id,
      amount: new Prisma.Decimal('220.00'),
      status: 'outbid',
    },
  });

  await prisma.bid.create({
    data: {
      auctionId: soldAuction.id,
      bidderUserId: buyerTwo.id,
      amount: new Prisma.Decimal('240.00'),
      status: 'outbid',
    },
  });

  const soldWinningBid = await prisma.bid.create({
    data: {
      auctionId: soldAuction.id,
      bidderUserId: buyerTwo.id,
      amount: new Prisma.Decimal('260.00'),
      status: 'won',
    },
  });

  await prisma.auction.update({
    where: { id: soldAuction.id },
    data: {
      winnerBidId: soldWinningBid.id,
    },
  });

  console.log('Seeded 1 category, 3 users, 2 lots, 2 auctions and 5 bids.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
