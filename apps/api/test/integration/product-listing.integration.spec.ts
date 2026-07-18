import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { BidsService } from '../../src/bids/bids.service';
import { Clock } from '../../src/core/time';
import { createIntegrationDatabaseContext, type IntegrationDatabaseContext } from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const now = new Date('2026-07-18T11:00:00.000Z');
class FixedClock extends Clock { now(): Date { return now; } }

async function reset() {
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

async function fixture() {
  const suffix = randomUUID();
  const seller = await prisma.user.create({ data: { email: `seller.${suffix}@bidplace.test`, passwordHash: 'test', phone: `+37529${suffix.replace(/-/g, '').slice(0, 7)}`, displayName: 'Seller' } });
  const buyer = await prisma.user.create({ data: { email: `buyer.${suffix}@bidplace.test`, passwordHash: 'test', phone: `+37544${suffix.replace(/-/g, '').slice(0, 7)}`, displayName: 'Buyer', phoneVerifiedAt: new Date() } });
  const category = await prisma.category.create({ data: { slug: `art-${suffix}`, name: 'Art' } });
  const sellerProfile = await prisma.sellerProfile.create({ data: { userId: seller.id, slug: `seller-${suffix}`, sellerType: 'creator', storeName: 'Seller', country: 'BY', contactPreference: 'telegram', status: 'APPROVED' } });
  const product = await prisma.product.create({ data: { publicId: randomUUID().replace(/-/g, '').slice(0, 11), sellerProfileId: sellerProfile.id, categoryId: category.id, title: 'Product', story: 'Story', condition: 'New', uniqueness: 'One', provenance: 'Direct', city: 'Minsk', deliveryInfo: 'Pickup', status: 'APPROVED' } });
  return { seller, buyer, product };
}

function listingData(productId: string, status: 'SCHEDULED' | 'LIVE' | 'ENDED') {
  const startsAt = new Date('2026-07-18T10:00:00.000Z');
  const endsAt = new Date('2026-07-18T12:00:00.000Z');
  return { productId, status, startsAt, originalEndsAt: endsAt, endsAt, currentPrice: new Prisma.Decimal(10), auctionRules: { create: { startPrice: new Prisma.Decimal(10) } } };
}

beforeAll(async () => { context = await createIntegrationDatabaseContext(); prisma = context.prisma; });
afterEach(reset);
afterAll(async () => { await context.cleanup(); });

describe('Product / Listing PostgreSQL invariants', () => {
  it('allows only one scheduled or live Listing for a Product', async () => {
    const { product } = await fixture();
    await prisma.listing.create({ data: listingData(product.id, 'SCHEDULED') });

    await expect(prisma.listing.create({ data: listingData(product.id, 'LIVE') }))
      .rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows only one non-cancelled Order for a Listing', async () => {
    const { seller, buyer, product } = await fixture();
    const listing = await prisma.listing.create({ data: listingData(product.id, 'ENDED') });
    const firstBid = await prisma.bid.create({ data: { listingId: listing.id, bidderUserId: buyer.id, idempotencyKey: 'first', amount: new Prisma.Decimal(10) } });
    const secondBid = await prisma.bid.create({ data: { listingId: listing.id, bidderUserId: seller.id, idempotencyKey: 'second', amount: new Prisma.Decimal(11) } });
    await prisma.order.create({ data: { publicId: 'orderPublic1', listingId: listing.id, sellerId: seller.id, buyerId: buyer.id, sourceBidId: firstBid.id, finalAmount: firstBid.amount, contactDueAt: new Date() } });

    await expect(prisma.order.create({ data: { publicId: 'orderPublic2', listingId: listing.id, sellerId: seller.id, buyerId: seller.id, sourceBidId: secondBid.id, finalAmount: secondBid.amount, contactDueAt: new Date() } }))
      .rejects.toMatchObject({ code: 'P2002' });
  });

  it('enforces bidder idempotency across Listing requests', async () => {
    const { buyer, product } = await fixture();
    const first = await prisma.listing.create({ data: listingData(product.id, 'ENDED') });
    const anotherProduct = await prisma.product.create({ data: { publicId: randomUUID().replace(/-/g, '').slice(0, 11), sellerProfileId: product.sellerProfileId, title: 'Other', status: 'DRAFT' } });
    const second = await prisma.listing.create({ data: listingData(anotherProduct.id, 'ENDED') });
    await prisma.bid.create({ data: { listingId: first.id, bidderUserId: buyer.id, idempotencyKey: 'same-key', amount: new Prisma.Decimal(10) } });

    await expect(prisma.bid.create({ data: { listingId: second.id, bidderUserId: buyer.id, idempotencyKey: 'same-key', amount: new Prisma.Decimal(11) } }))
      .rejects.toMatchObject({ code: 'P2002' });
  });

  it('replays an accepted Bid idempotently without a second write or event', async () => {
    const { buyer, product } = await fixture();
    const listing = await prisma.listing.create({ data: listingData(product.id, 'LIVE') });
    const realtime = { emit: vi.fn() };
    const bids = new BidsService(prisma as never, new FixedClock(), realtime as never);

    const first = await bids.place(buyer.id, listing.id, 'same-request', { amount: 11 });
    const replay = await bids.place(buyer.id, listing.id, 'same-request', { amount: 11 });
    const current = await prisma.listing.findUnique({ where: { id: listing.id } });

    expect(replay.bid.id).toBe(first.bid.id);
    expect(await prisma.bid.count({ where: { listingId: listing.id } })).toBe(1);
    expect(current?.currentPrice.toNumber()).toBe(11);
    expect(current?.bidCount).toBe(1);
    expect(realtime.emit).toHaveBeenCalledTimes(1);
  });
});
