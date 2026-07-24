import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Prisma, PrismaClient } from '../../../packages/database/dist/index.js';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be test to close the E2E listing');
}

const databaseUrl = process.env.E2E_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('E2E_DATABASE_URL is required');
}

const database = new URL(databaseUrl);
const databaseName = database.pathname.replace(/^\//, '');

if (databaseName !== 'bidplace_e2e') {
  throw new Error(`E2E_DATABASE_URL must target bidplace_e2e, got ${databaseName}`);
}

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

const bid = await prisma.bid.findFirstOrThrow({
  where: { listingId: state.listing.id },
  orderBy: { amount: 'desc' },
});
const order = await prisma.order.create({
  data: {
    publicId: 'e2eOrder001',
    listingId: state.listing.id,
    sellerId: state.seller.id,
    buyerId: bid.bidderUserId,
    sourceBidId: bid.id,
    finalAmount: new Prisma.Decimal(bid.amount),
    contactDueAt: new Date(Date.now() + 24 * 60 * 60 * 1_000),
    sellerHandoffType: 'TELEGRAM',
    sellerHandoffValue: '@e2eseller',
    buyerEmailAtClose: state.buyer.email,
    handoffInitiator: 'BUYER_CONTACTS_SELLER',
  },
});
await prisma.listing.update({
  where: { id: state.listing.id },
  data: { status: 'ENDED', closedAt: new Date(), currentPrice: bid.amount },
});
await writeFile(statePath, JSON.stringify({ ...state, order }));
await prisma.$disconnect();
