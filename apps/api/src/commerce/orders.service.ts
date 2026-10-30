import { randomInt } from 'node:crypto';

import {
  ApiErrorCode,
  ORDER_SOURCES,
  type Currency,
  type PurchaseRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import {
  PrismaService,
  prismaUniqueTargets,
  runReadCommittedTransaction,
} from '../core/database';
import { AppException } from '../core/errors';
import { PublicIdService } from '../core/public-id';
import { dbNow } from '../core/time';
import {
  enqueueNotification,
  type NotificationKind,
} from '../notifications/notification-outbox';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { type BuyerListing, CommerceGuards } from './commerce-guards';
import { toPublicLot, visibleOrderStatus } from './commerce.mapper';
import { canPurchaseFixed } from './listing-state';
import {
  assertOrderTransition,
  faultOf,
  type OrderActor,
  type OrderFailReason,
} from './order-state';

const HOUR_MS = 60 * 60 * 1000;
const PUBLIC_ID = /^[A-Za-z0-9_-]{11}$/;

export type CreateOrderInput = {
  listing: {
    id: string;
    productId: string;
    sellerUserId: string;
    currency: string;
    contactWindowHours: number;
  };
  buyerUserId: string;
  amountMinor: number;
  source: (typeof ORDER_SOURCES)[number];
  sourceBidId?: string;
  status: 'ACTIVE' | 'OFFERED';
  buyerComment?: string;
  idempotencyKey?: string;
  now: Date;
};

type PurchaseInput = PurchaseRequest & {
  ip: string;
  browserId: string | null;
  checkTurnstile: boolean;
};

type StoredOrder = Prisma.OrderGetPayload<true>;

const purchaseListingSelect = {
  id: true,
  productId: true,
  sellerUserId: true,
  type: true,
  status: true,
  currency: true,
  priceMinor: true,
  startsAt: true,
  endsAt: true,
  contactWindowHours: true,
  bidCount: true,
} satisfies Prisma.ListingSelect;

type PurchaseListing = Prisma.ListingGetPayload<{
  select: typeof purchaseListingSelect;
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicIds: PublicIdService,
    private readonly guards: CommerceGuards,
    private readonly antifraud: AntifraudService,
  ) {}

  async purchase(
    userId: string,
    listingId: string,
    input: PurchaseInput,
  ): Promise<{
    order: {
      publicId: string;
      dealCode: string;
      status: string;
      source: string;
      amountMinor: number;
      currency: string;
      activatedAt: string;
      contactDeadlineAt: string;
      buyerComment: string | null;
    };
    lot: ReturnType<typeof toPublicLot>;
  }> {
    const turnstile = input.checkTurnstile
      ? await this.antifraud.verifySignal('purchase', input.turnstileToken, input.ip)
      : 'skip';
    const anchor = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { productId: true },
    });
    if (!anchor) throw listingNotFound();

    try {
      return await runReadCommittedTransaction(this.prisma, async (tx) => {
        await lockProductRowForUpdate(tx, anchor.productId);
        await this.antifraud.lockUsers(tx, [userId]);
        const now = await dbNow(tx);
        const listing = await tx.listing.findUnique({
          where: { id: listingId },
          select: purchaseListingSelect,
        });
        if (!listing) throw listingNotFound();
        const replay = await tx.order.findFirst({
          where: {
            listingId,
            buyerUserId: userId,
            idempotencyKey: input.idempotencyKey,
          },
        });
        if (replay) return this.present(tx, replay, now);

        if (!canPurchaseFixed(listing, now)) throw listingNotOpen();
        if (listing.priceMinor === null) {
          throw new Error('Fixed price is missing');
        }
        await this.guards.assertBuyerEligible(tx, {
          userId,
          listing: asBuyerListing(listing),
          now,
          userLocked: true,
          action: 'purchase',
        });
        const seller = await tx.sellerProfile.findUnique({
          where: { userId: listing.sellerUserId },
          select: { status: true },
        });
        if (!seller) throw new NotFoundException('Seller profile not found');
        assertApprovedSeller(seller.status);

        const order = await this.createOrder(tx, {
          listing,
          buyerUserId: userId,
          amountMinor: listing.priceMinor,
          source: 'FIXED_PURCHASE',
          status: 'ACTIVE',
          ...(input.comment === undefined ? {} : { buyerComment: input.comment }),
          idempotencyKey: input.idempotencyKey,
          now,
        });
        const ended = await tx.listing.updateMany({
          where: { id: listing.id, type: 'FIXED', status: 'LIVE' },
          data: { status: 'ENDED', endedAt: now },
        });
        if (ended.count !== 1) {
          throw new AppException({
            status: 409,
            code: ApiErrorCode.LISTING_CHANGED,
            message: 'Listing changed',
          });
        }
        await this.antifraud.recordPurchaseSignals(tx, {
          userId,
          listingId: listing.id,
          sellerUserId: listing.sellerUserId,
          turnstile,
          browserId: input.browserId,
        });
        return this.present(tx, order, now);
      });
    } catch (error) {
      if (prismaUniqueTargets(error).includes('one_open_order_per_product')) {
        throw listingNotOpen();
      }
      throw error;
    }
  }

  async createOrder(
    tx: Prisma.TransactionClient,
    input: CreateOrderInput,
  ): Promise<StoredOrder> {
    const comment = storedComment(input.buyerComment);
    const product = await tx.product.findUnique({
      where: { id: input.listing.productId },
      select: {
        title: true,
        publicId: true,
        images: {
          orderBy: { position: 'asc' },
          take: 1,
          select: { id: true },
        },
        sellerProfile: { select: { fullName: true } },
      },
    });
    const title = product?.title?.trim();
    const sellerName = product?.sellerProfile.fullName.trim();
    if (!product || !title || !sellerName) {
      throw new Error('Order snapshot is missing');
    }
    const currency = currencyOf(input.listing.currency);
    const publicId = await allocatePublicId(tx, this.publicIds);
    const active = input.status === 'ACTIVE';
    const order = await tx.order.create({
      data: {
        publicId,
        dealCode: randomInt(0, 1_000_000).toString().padStart(6, '0'),
        productId: input.listing.productId,
        listingId: input.listing.id,
        sellerUserId: input.listing.sellerUserId,
        buyerUserId: input.buyerUserId,
        source: input.source,
        sourceBidId: input.sourceBidId ?? null,
        amountMinor: input.amountMinor,
        currency,
        status: input.status,
        offerExpiresAt: active
          ? null
          : addHours(input.now, input.listing.contactWindowHours),
        activatedAt: active ? input.now : null,
        contactDeadlineAt: active
          ? addHours(input.now, input.listing.contactWindowHours)
          : null,
        buyerComment: comment,
        idempotencyKey: input.idempotencyKey ?? null,
        workTitleSnapshot: title,
        workPublicIdSnapshot: product.publicId,
        coverImageIdSnapshot: product.images[0]?.id ?? null,
        sellerNameSnapshot: sellerName,
        createdAt: input.now,
      },
    });
    const payload = {
      orderPublicId: order.publicId,
      listingId: input.listing.id,
      workTitle: title,
      amountMinor: order.amountMinor,
      currency,
      ...(comment ? { comment } : {}),
    };
    for (const letter of letterPlan(input.source, input.status)) {
      await enqueueNotification(tx, {
        userId:
          letter.party === 'buyer' ? input.buyerUserId : input.listing.sellerUserId,
        kind: letter.kind,
        payload,
      });
    }
    return order;
  }

  async failFixedPriceReservation(input: {
    orderId: string;
    actor: OrderActor;
    failReason: OrderFailReason;
  }): Promise<void> {
    const located = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      select: { productId: true },
    });
    if (!located) throw new NotFoundException('Order not found');
    await runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, located.productId);
      const locked = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!locked) throw new NotFoundException('Order not found');
      await this.antifraud.lockUsers(tx, [locked.buyerUserId, locked.sellerUserId]);
      const now = await dbNow(tx);
      const order = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.source !== 'FIXED_PURCHASE') {
        throw new Error('Only a fixed-price order restores its listing');
      }
      assertOrderTransition(
        order,
        input.actor,
        { to: 'FAILED', failReason: input.failReason },
        now,
      );
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status: 'FAILED',
          failReason: input.failReason,
          faultSide: faultOf(input.failReason),
          failedAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED,
          message: 'Order transition is not allowed',
        });
      }
      await restoreFixedPriceListing(tx, order.listingId);
    });
  }

  private async present(
    tx: Prisma.TransactionClient,
    order: StoredOrder,
    now: Date,
  ) {
    if (!order.activatedAt || !order.contactDeadlineAt) {
      throw new Error('Active order deadlines are missing');
    }
    const listing = await tx.listing.findUnique({
      where: { id: order.listingId },
      include: {
        auctionRules: { select: { startPriceMinor: true } },
        orders: { select: { status: true } },
      },
    });
    if (!listing) throw listingNotFound();
    const view = await this.guards.describeBuyer(tx, {
      userId: order.buyerUserId,
      listing: asBuyerListing(listing),
      now,
    });
    const user = await tx.user.findUnique({
      where: { id: order.buyerUserId },
      select: { role: true },
    });
    return {
      order: {
        publicId: order.publicId,
        dealCode: order.dealCode,
        status: order.status,
        source: order.source,
        amountMinor: order.amountMinor,
        currency: order.currency,
        activatedAt: order.activatedAt.toISOString(),
        contactDeadlineAt: order.contactDeadlineAt.toISOString(),
        buyerComment: order.buyerComment,
      },
      lot: toPublicLot({
        listing,
        startPriceMinor: listing.auctionRules?.startPriceMinor ?? null,
        now,
        orderStatus: visibleOrderStatus(listing.orders),
        viewer: {
          role: user?.role === 'admin' ? 'admin' : 'buyer',
          isLeading: view.isLeading,
          blockedReason: view.blockedReason,
        },
      }),
    };
  }
}

export async function restoreFixedPriceListing(
  tx: Prisma.TransactionClient,
  listingId: string,
): Promise<void> {
  const updated = await tx.listing.updateMany({
    where: { id: listingId, type: 'FIXED', status: 'ENDED' },
    data: { status: 'LIVE', endedAt: null },
  });
  if (updated.count !== 1) {
    throw new AppException({
      status: 409,
      code: ApiErrorCode.LISTING_CHANGED,
      message: 'Listing was not restored',
    });
  }
}

function letterPlan(
  source: (typeof ORDER_SOURCES)[number],
  status: 'ACTIVE' | 'OFFERED',
): Array<{ party: 'buyer' | 'seller'; kind: NotificationKind }> {
  if (status === 'ACTIVE' && source === 'FIXED_PURCHASE') {
    return [
      { party: 'buyer', kind: 'PURCHASED' },
      { party: 'seller', kind: 'LISTING_SOLD' },
    ];
  }
  if (status === 'ACTIVE' && source === 'AUCTION_WIN') {
    return [
      { party: 'buyer', kind: 'BID_WON' },
      { party: 'seller', kind: 'LISTING_SOLD' },
    ];
  }
  if (status === 'OFFERED' && source === 'SECOND_CHANCE') {
    return [{ party: 'buyer', kind: 'OFFER_RECEIVED' }];
  }
  throw new Error(`No order letters for ${source} ${status}`);
}

function asBuyerListing(listing: PurchaseListing): BuyerListing {
  return {
    id: listing.id,
    sellerUserId: listing.sellerUserId,
    type: listing.type,
    status: listing.status,
    startsAt: listing.startsAt,
    endsAt: listing.endsAt,
    bidCount: listing.bidCount,
  };
}

function storedComment(comment: string | undefined): string | null {
  const trimmed = comment?.trim();
  return trimmed ? trimmed : null;
}

function addHours(at: Date, hours: number): Date {
  return new Date(at.getTime() + hours * HOUR_MS);
}

function currencyOf(value: string): Currency {
  if (value === 'BYN' || value === 'RUB') return value;
  throw new Error(`Unsupported listing currency ${value}`);
}

async function allocatePublicId(
  tx: Prisma.TransactionClient,
  publicIds: PublicIdService,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const publicId = publicIds.generate();
    if (!PUBLIC_ID.test(publicId)) {
      throw new Error('Order public id is invalid');
    }
    const taken = await tx.order.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!taken) return publicId;
  }
  throw new Error('Order public id was not allocated');
}

function listingNotFound(): AppException {
  return new AppException({
    status: 404,
    code: ApiErrorCode.LISTING_NOT_FOUND,
    message: 'Listing not found',
  });
}

function listingNotOpen(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.LISTING_NOT_OPEN,
    message: 'Listing is not open',
  });
}
