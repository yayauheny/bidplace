import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Prisma, PrismaClient } from '../../../packages/database/dist/index.js';

import { assertDisposableDatabase } from './disposable-database.mjs';

const databaseUrl = process.env.E2E_DATABASE_URL;
assertDisposableDatabase(databaseUrl, {
  nodeEnv: process.env.NODE_ENV,
});

const e2e = resolve(import.meta.dirname);
const statePath = resolve(e2e, '.state.json');
const state = JSON.parse(await readFile(statePath, 'utf8'));
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

const listing = await prisma.listing.findUniqueOrThrow({
  where: { id: state.listing.id },
  select: {
    id: true,
    product: {
      select: {
        sellerProfile: {
          select: {
            userId: true,
            handoffContactType: true,
            handoffContactValue: true,
            handoffInitiator: true,
          },
        },
      },
    },
  },
});

const bid = await prisma.bid.findFirstOrThrow({
  where: { listingId: listing.id },
  orderBy: { amount: 'desc' },
});
const buyer = await prisma.user.findUniqueOrThrow({
  where: { id: bid.bidderUserId },
  select: { email: true },
});
const order = await prisma.order.create({
  data: {
    publicId: 'e2eOrder001',
    listingId: listing.id,
    sellerId: listing.product.sellerProfile.userId,
    buyerId: bid.bidderUserId,
    sourceBidId: bid.id,
    finalAmount: new Prisma.Decimal(bid.amount),
    contactDueAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    sellerHandoffType: listing.product.sellerProfile.handoffContactType,
    sellerHandoffValue: listing.product.sellerProfile.handoffContactValue,
    buyerEmailAtClose: buyer.email,
    handoffInitiator: listing.product.sellerProfile.handoffInitiator,
  },
});
await prisma.listing.update({
  where: { id: listing.id },
  data: { status: 'ENDED', closedAt: new Date(), currentPrice: bid.amount },
});
await writeFile(statePath, JSON.stringify({ ...state, order }));
await prisma.$disconnect();
