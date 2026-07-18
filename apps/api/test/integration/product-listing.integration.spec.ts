import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { BidsService } from '../../src/bids/bids.service';
import { Clock } from '../../src/core/time';
import { ListingLifecycleService } from '../../src/lifecycle/listing-lifecycle.service';
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
afterAll(async () => { await context?.cleanup(); });

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

  it('serializes concurrent accepted Bids into the canonical higher price', async () => {
    const { product, buyer } = await fixture();
    const secondBuyer = await prisma.user.create({ data: { email: `second.${randomUUID()}@bidplace.test`, passwordHash: 'test', phone: `+37533${randomUUID().replace(/-/g, '').slice(0, 7)}`, displayName: 'Second', phoneVerifiedAt: new Date() } });
    const listing = await prisma.listing.create({ data: listingData(product.id, 'LIVE') });
    const bids = new BidsService(prisma as never, new FixedClock(), { emit: vi.fn() } as never);

    await Promise.all([
      bids.place(buyer.id, listing.id, 'concurrent-one', { amount: 11 }),
      bids.place(secondBuyer.id, listing.id, 'concurrent-two', { amount: 12 }),
    ]);
    const current = await prisma.listing.findUnique({ where: { id: listing.id } });

    expect(await prisma.bid.count({ where: { listingId: listing.id } })).toBe(2);
    expect(current?.currentPrice.toNumber()).toBe(12);
    expect(current?.bidCount).toBe(2);
  });

  it('closes an expired Listing once and creates an Order for the deterministic top Bid', async () => {
    const { seller, buyer, product } = await fixture();
    const listing = await prisma.listing.create({ data: { ...listingData(product.id, 'LIVE'), endsAt: now, originalEndsAt: now } });
    const lower = await prisma.bid.create({ data: { listingId: listing.id, bidderUserId: seller.id, idempotencyKey: 'lower', amount: new Prisma.Decimal(10) } });
    const winner = await prisma.bid.create({ data: { listingId: listing.id, bidderUserId: buyer.id, idempotencyKey: 'winner', amount: new Prisma.Decimal(11) } });
    void lower;
    const realtime = { emit: vi.fn() };
    const lifecycle = new ListingLifecycleService(prisma as never, new FixedClock(), { generate: () => 'orderPub001' } as never, realtime as never);

    expect(await lifecycle.close(listing.id, now)).toBe(true);
    expect(await lifecycle.close(listing.id, now)).toBe(false);
    const order = await prisma.order.findFirst({ where: { listingId: listing.id } });
    const closed = await prisma.listing.findUnique({ where: { id: listing.id } });

    expect(order?.sourceBidId).toBe(winner.id);
    expect(order?.buyerId).toBe(buyer.id);
    expect(closed?.status).toBe('ENDED');
    expect(realtime.emit).toHaveBeenCalledTimes(1);
  });

  it('rejects a Bid at the close boundary while the Listing closes with its existing winner', async () => {
    const { seller, buyer, product } = await fixture();
    const nextBuyer = await prisma.user.create({ data: { email: `next.${randomUUID()}@bidplace.test`, passwordHash: 'test', phone: `+37525${randomUUID().replace(/-/g, '').slice(0, 7)}`, displayName: 'Next', phoneVerifiedAt: new Date() } });
    const listing = await prisma.listing.create({ data: { ...listingData(product.id, 'LIVE'), endsAt: now, originalEndsAt: now } });
    const winner = await prisma.bid.create({ data: { listingId: listing.id, bidderUserId: buyer.id, idempotencyKey: 'existing-winner', amount: new Prisma.Decimal(10) } });
    const bids = new BidsService(prisma as never, new FixedClock(), { emit: vi.fn() } as never);
    const lifecycle = new ListingLifecycleService(prisma as never, new FixedClock(), { generate: () => 'orderPub002' } as never, { emit: vi.fn() } as never);
    void seller;

    const [close, bid] = await Promise.allSettled([
      lifecycle.close(listing.id, now),
      bids.place(nextBuyer.id, listing.id, 'close-race', { amount: 11 }),
    ]);
    const closed = await prisma.listing.findUnique({ where: { id: listing.id } });
    const order = await prisma.order.findFirst({ where: { listingId: listing.id } });

    expect(close).toMatchObject({ status: 'fulfilled', value: true });
    expect(bid).toMatchObject({ status: 'rejected', reason: { message: 'Listing is not open for bids' } });
    expect(await prisma.bid.count({ where: { listingId: listing.id } })).toBe(1);
    expect(closed?.status).toBe('ENDED');
    expect(order?.sourceBidId).toBe(winner.id);
  });
});
