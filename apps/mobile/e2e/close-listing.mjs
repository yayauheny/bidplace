import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Prisma, PrismaClient } from '../../../packages/database/dist/index.js';

const e2e = resolve(import.meta.dirname);
const statePath = resolve(e2e, '.state.json');
const state = JSON.parse(await readFile(statePath, 'utf8'));
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://auction:auction@127.0.0.1:5432/bidplace_e2e?schema=public',
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
  },
});
await prisma.listing.update({
  where: { id: state.listing.id },
  data: { status: 'ENDED', closedAt: new Date(), currentPrice: bid.amount },
});
await writeFile(statePath, JSON.stringify({ ...state, order }));
await prisma.$disconnect();
