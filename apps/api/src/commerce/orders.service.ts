import { randomInt } from 'node:crypto';

import {
  ApiErrorCode,
  ORDER_SOURCES,
  type AdminOrderOutcomeRequest,
  type Currency,
  type FailOrderRequest,
  type OrderDetail,
  type OrdersListQuery,
  type PurchaseRequest,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

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
import {
  assertNoOpenListing,
  assertWorkCanTakeNextOffer,
  lockProductRowForUpdate,
} from '../products/product-write-guard';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { type BuyerListing, CommerceGuards } from './commerce-guards';
import { toPublicLot, visibleOrderStatus } from './commerce.mapper';
import { canPurchaseFixed } from './listing-state';
import { MAX_SECOND_CHANCE_OFFERS, rankBidders } from './order-offers';
import {
  assertOrderTransition,
  faultOf,
  type OrderActor,
  type OrderFailReason,
  type OrderTransition,
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

type CommitOutcomeInput = {
  productId: string;
  orderId: string;
  actor: OrderActor;
  actorUserId: string | null;
  next: OrderTransition;
  adminReason?: string;
  viewerId: string;
  checkAccept?: boolean;
  requireFixedPurchase?: boolean;
  requireAdmin?: boolean;
  card?: false;
};

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
        const sellerLock = await tx.listing.findUnique({
          where: { id: listingId },
          select: { sellerUserId: true },
        });
        if (!sellerLock) throw listingNotFound();
        await this.antifraud.lockUsers(tx, [userId, sellerLock.sellerUserId]);
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
        if (replay) {
          if (replay.buyerComment !== storedComment(input.comment)) {
            throw new AppException({
              status: 409,
              code: ApiErrorCode.IDEMPOTENCY_KEY_REUSED,
              message: 'Idempotency key was reused with a different payload',
            });
          }
          return this.present(tx, replay, now);
        }

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
        if (!(await this.guards.sellerMaySell(tx, listing.sellerUserId))) {
          throw listingNotOpen();
        }

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
      select: { id: true, productId: true, buyerUserId: true },
    });
    if (!located) throw new NotFoundException('Order not found');
    await this.commitOutcome({
      productId: located.productId,
      orderId: located.id,
      actor: input.actor,
      actorUserId: null,
      next: { to: 'FAILED', failReason: input.failReason },
      viewerId: located.buyerUserId,
      requireFixedPurchase: true,
    });
  }

  async get(viewerId: string, publicId: string): Promise<OrderDetail> {
    const order = await this.prisma.order.findUnique({ where: { publicId } });
    if (!order) throw new NotFoundException('Order not found');
    return this.orderCard(this.prisma, order, viewerId);
  }

  async list(viewerId: string, query: OrdersListQuery) {
    const statuses =
      query.state === 'open'
        ? (['OFFERED', 'ACTIVE'] as const)
        : (['COMPLETED', 'FAILED'] as const);
    const orders = await this.prisma.order.findMany({
      where: {
        ...(query.role === 'buyer'
          ? { buyerUserId: viewerId }
          : { sellerUserId: viewerId }),
        status: { in: [...statuses] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      orders: orders.map((order) => orderSummary(order, query.role)),
    };
  }

  async accept(buyerUserId: string, publicId: string): Promise<OrderDetail> {
    const order = await this.participantOrder(publicId, buyerUserId);
    if (order.buyerUserId !== buyerUserId) throw orderTransitionNotAllowed();
    return this.commitOutcome({
      productId: order.productId,
      orderId: order.id,
      actor: 'buyer',
      actorUserId: buyerUserId,
      next: { to: 'ACTIVE' },
      viewerId: buyerUserId,
      checkAccept: true,
    });
  }

  async decline(buyerUserId: string, publicId: string): Promise<OrderDetail> {
    const order = await this.participantOrder(publicId, buyerUserId);
    if (order.buyerUserId !== buyerUserId) throw orderTransitionNotAllowed();
    return this.commitOutcome({
      productId: order.productId,
      orderId: order.id,
      actor: 'buyer',
      actorUserId: buyerUserId,
      next: { to: 'FAILED', failReason: 'OFFER_DECLINED' },
      viewerId: buyerUserId,
    });
  }

  async complete(sellerUserId: string, publicId: string): Promise<OrderDetail> {
    const order = await this.participantOrder(publicId, sellerUserId);
    if (order.sellerUserId !== sellerUserId) throw orderTransitionNotAllowed();
    return this.commitOutcome({
      productId: order.productId,
      orderId: order.id,
      actor: 'seller',
      actorUserId: sellerUserId,
      next: { to: 'COMPLETED' },
      viewerId: sellerUserId,
    });
  }

  async fail(
    userId: string,
    publicId: string,
    body: FailOrderRequest,
  ): Promise<OrderDetail> {
    const order = await this.participantOrder(publicId, userId);
    const actor =
      order.buyerUserId === userId
        ? 'buyer'
        : order.sellerUserId === userId
          ? 'seller'
          : null;
    if (!actor) throw orderTransitionNotAllowed();
    if (actor === 'buyer' && body.reason === 'BUYER_REFUSED' && body.confirm !== true) {
      throw new AppException({
        status: 400,
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Buyer refusal must be confirmed',
      });
    }
    return this.commitOutcome({
      productId: order.productId,
      orderId: order.id,
      actor,
      actorUserId: userId,
      next: { to: 'FAILED', failReason: body.reason },
      viewerId: userId,
    });
  }

  async note(sellerUserId: string, publicId: string, note: string): Promise<OrderDetail> {
    const order = await this.participantOrder(publicId, sellerUserId);
    if (order.sellerUserId !== sellerUserId) {
      throw new ForbiddenException('Only the author can write the order note');
    }
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, order.productId);
      await this.antifraud.lockUsers(tx, [sellerUserId]);
      await dbNow(tx);
      const updated = await tx.order.updateMany({
        where: { id: order.id, sellerUserId },
        data: { sellerNote: note },
      });
      if (updated.count !== 1) throw orderTransitionNotAllowed();
      const stored = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      return this.orderCard(tx, stored, sellerUserId);
    });
  }

  async offerNext(sellerUserId: string, publicId: string): Promise<OrderDetail> {
    const anchor = await this.prisma.order.findUnique({ where: { publicId } });
    if (!anchor || anchor.sellerUserId !== sellerUserId) {
      throw new NotFoundException('Order not found');
    }
    try {
      return await runReadCommittedTransaction(this.prisma, async (tx) => {
        await lockProductRowForUpdate(tx, anchor.productId);
        const seller = await tx.sellerProfile.findUnique({
          where: { userId: sellerUserId },
          select: { status: true },
        });
        if (!seller) {
          throw new ForbiddenException('Approved SellerProfile is required');
        }
        assertApprovedSeller(seller.status);
        await assertWorkCanTakeNextOffer(tx, anchor.productId);
        const order = await tx.order.findUnique({ where: { id: anchor.id } });
        if (!order || order.sellerUserId !== sellerUserId) {
          throw new NotFoundException('Order not found');
        }
        const listing = await tx.listing.findUnique({
          where: { id: order.listingId },
          select: {
            id: true,
            productId: true,
            sellerUserId: true,
            currency: true,
            contactWindowHours: true,
            type: true,
            status: true,
          },
        });
        if (!listing) throw new NotFoundException('Order not found');
        const orders = await tx.order.findMany({ where: { listingId: listing.id } });
        const bids = await tx.bid.findMany({
          where: { listingId: listing.id },
          select: {
            id: true,
            bidderUserId: true,
            amountMinor: true,
            createdAt: true,
            voidedAt: true,
          },
        });
        const decision = offerDecision(order, listing, orders);
        if (decision === 'none') throw noNextBidder();
        if (decision !== 'ok') throw orderTransitionNotAllowed();
        const ranked = rankBidders(bids, new Set(orders.map((row) => row.buyerUserId)));
        await this.antifraud.lockUsers(tx, [
          ...new Set([sellerUserId, ...ranked.map((bidder) => bidder.userId)]),
        ]);
        if (!(await this.guards.sellerMaySell(tx, sellerUserId))) {
          throw new ForbiddenException('Approved SellerProfile is required');
        }
        const now = await dbNow(tx);
        const current = await tx.order.findUnique({ where: { id: order.id } });
        const currentOrders = await tx.order.findMany({
          where: { listingId: listing.id },
        });
        const currentBids = await tx.bid.findMany({
          where: { listingId: listing.id },
          select: {
            id: true,
            bidderUserId: true,
            amountMinor: true,
            createdAt: true,
            voidedAt: true,
          },
        });
        const again = current ? offerDecision(current, listing, currentOrders) : 'transition';
        if (again === 'none') throw noNextBidder();
        if (again !== 'ok') throw orderTransitionNotAllowed();
        const next = rankBidders(
          currentBids,
          new Set(currentOrders.map((row) => row.buyerUserId)),
        );
        for (const bidder of next) {
          if (await this.antifraud.isPurchaseBlocked(tx, bidder.userId)) continue;
          const created = await this.createOrder(tx, {
            listing,
            buyerUserId: bidder.userId,
            amountMinor: bidder.amountMinor,
            source: 'SECOND_CHANCE',
            sourceBidId: bidder.bidId,
            status: 'OFFERED',
            now,
          });
          return this.orderCard(tx, created, sellerUserId);
        }
        throw noNextBidder();
      });
    } catch (error) {
      if (prismaUniqueTargets(error).includes('one_open_order_per_product')) {
        throw orderTransitionNotAllowed();
      }
      throw error;
    }
  }

  async expireOffered(orderId: string): Promise<boolean> {
    const anchor = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, productId: true, sellerUserId: true },
    });
    if (!anchor) return false;
    try {
      await this.commitOutcome({
        productId: anchor.productId,
        orderId: anchor.id,
        actor: 'system',
        actorUserId: null,
        next: { to: 'FAILED', failReason: 'OFFER_EXPIRED' },
        viewerId: anchor.sellerUserId,
        card: false,
      });
      return true;
    } catch (error) {
      if (
        error instanceof AppException &&
        error.apiCode === ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED
      ) {
        return false;
      }
      throw error;
    }
  }

  async voidStrike(
    adminId: string,
    publicId: string,
    reason: string,
  ): Promise<OrderDetail> {
    const anchor = await this.prisma.order.findUnique({ where: { publicId } });
    if (!anchor) throw new NotFoundException('Order not found');
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, anchor.productId);
      await this.antifraud.lockUsers(tx, [
        adminId,
        anchor.buyerUserId,
        anchor.sellerUserId,
      ]);
      const now = await dbNow(tx);
      await this.assertActiveAdmin(tx, adminId);
      const order = await tx.order.findUnique({ where: { id: anchor.id } });
      if (!order) throw new NotFoundException('Order not found');
      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'FAILED',
          faultSide: 'BUYER',
          strikeVoidedAt: null,
        },
        data: { strikeVoidedAt: now },
      });
      if (updated.count !== 1) throw orderTransitionNotAllowed();
      await tx.auditEvent.create({
        data: {
          actorUserId: adminId,
          targetType: 'ORDER',
          targetId: order.id,
          oldStatus: 'strike',
          newStatus: 'voided',
          reason: `${order.publicId}: ${reason}`,
          action: 'ORDER_VOID_STRIKE',
        },
      });
      const stored = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      return this.orderCard(tx, stored, adminId);
    });
  }

  async adminOutcome(
    adminId: string,
    publicId: string,
    input: AdminOrderOutcomeRequest,
  ): Promise<OrderDetail> {
    const anchor = await this.prisma.order.findUnique({ where: { publicId } });
    if (!anchor) throw new NotFoundException('Order not found');
    return this.commitOutcome({
      productId: anchor.productId,
      orderId: anchor.id,
      actor: 'admin',
      actorUserId: adminId,
      next: {
        to: input.to,
        ...(input.to === 'FAILED' ? { failReason: input.failReason } : {}),
      },
      adminReason: input.reason,
      viewerId: adminId,
      requireAdmin: true,
    });
  }

  private async participantOrder(publicId: string, viewerId: string) {
    const order = await this.prisma.order.findUnique({ where: { publicId } });
    if (
      !order ||
      (order.buyerUserId !== viewerId &&
        order.sellerUserId !== viewerId &&
        !(await this.isAdmin(viewerId)))
    ) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });
    return user?.role === 'admin' && user.status === 'active';
  }

  async assertActiveAdmin(tx: Prisma.TransactionClient, adminId: string) {
    const admin = await tx.user.findUnique({
      where: { id: adminId },
      select: { role: true, status: true },
    });
    if (admin?.role !== 'admin' || admin.status !== 'active') {
      throw new ForbiddenException('Active admin required');
    }
  }

  private async commitOutcome(
    input: CommitOutcomeInput & { card: false },
  ): Promise<null>;
  private async commitOutcome(input: CommitOutcomeInput): Promise<OrderDetail>;
  private async commitOutcome(
    input: CommitOutcomeInput & { card?: false },
  ): Promise<OrderDetail | null> {
    return runReadCommittedTransaction(this.prisma, (tx) =>
      this.commitOutcomeInTransaction(tx, input),
    );
  }

  async commitOutcomeInTransaction(
    tx: Prisma.TransactionClient,
    input: CommitOutcomeInput & { card?: false },
  ): Promise<OrderDetail | null> {
      await lockProductRowForUpdate(tx, input.productId);
      const locked = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!locked) throw new NotFoundException('Order not found');
      const userIds = [locked.buyerUserId, locked.sellerUserId];
      if (input.actorUserId) userIds.push(input.actorUserId);
      await this.antifraud.lockUsers(tx, [...new Set(userIds)]);
      const now = await dbNow(tx);
      if (input.requireAdmin && input.actorUserId) {
        await this.assertActiveAdmin(tx, input.actorUserId);
      }
      const order = await tx.order.findUnique({ where: { id: input.orderId } });
      if (!order) throw new NotFoundException('Order not found');
      if (input.requireFixedPurchase && order.source !== 'FIXED_PURCHASE') {
        throw new Error('Only a fixed-price order restores its listing');
      }
      assertOrderTransition(order, input.actor, input.next, now);
      if (input.checkAccept) {
        await this.antifraud.assertCanAct(tx, order.buyerUserId, 'accept-offer');
      }
      const listing = await tx.listing.findUnique({
        where: { id: order.listingId },
        select: { id: true, type: true, status: true, contactWindowHours: true },
      });
      if (!listing) throw new Error('Order listing is missing');
      if (input.next.to === 'COMPLETED') {
        const other = await tx.order.findFirst({
          where: {
            productId: order.productId,
            id: { not: order.id },
            status: { in: ['OFFERED', 'ACTIVE', 'COMPLETED'] },
          },
          select: { id: true },
        });
        if (other) throw orderTransitionNotAllowed();
        await assertNoOpenListing(tx, order.productId);
      }
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: outcomeData(input.next, input.actor, now, listing.contactWindowHours),
      });
      if (updated.count !== 1) throw orderTransitionNotAllowed();
      if (
        input.next.to === 'FAILED' &&
        order.source === 'FIXED_PURCHASE' &&
        listing.type === 'FIXED' &&
        listing.status === 'ENDED'
      ) {
        await restoreFixedPriceListing(tx, listing.id);
      }
      const stored = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      await this.enqueueOutcomeLetters(tx, stored, listing.type, input.actor, input.next);
      if (input.actor === 'admin') {
        await tx.auditEvent.create({
          data: {
            actorUserId: input.actorUserId,
            targetType: 'ORDER',
            targetId: order.id,
            oldStatus: statusLabel(order.status, order.failReason),
            newStatus: statusLabel(input.next.to, input.next.failReason ?? null),
            reason: `${order.publicId}: ${input.adminReason ?? input.next.failReason ?? 'admin'}`,
            action: 'ORDER_OUTCOME',
          },
        });
      }
      if (input.card === false) return null;
      return this.orderCard(tx, stored, input.viewerId);
  }

  private async enqueueOutcomeLetters(
    tx: Prisma.TransactionClient,
    order: StoredOrder,
    listingType: string,
    actor: OrderActor,
    next: OrderTransition,
  ) {
    if (next.to === 'COMPLETED') {
      if (!order.completedAt) throw new Error('Completed order has no time');
      const buyer = await tx.user.findUnique({
        where: { id: order.buyerUserId },
        select: { displayName: true },
      });
      const payload = {
        orderPublicId: order.publicId,
        dealCode: order.dealCode,
        workTitle: order.workTitleSnapshot,
        sellerName: order.sellerNameSnapshot,
        buyerName: buyer?.displayName?.trim() || 'Покупатель',
        amountMinor: order.amountMinor,
        currency: order.currency,
        completedAt: order.completedAt.toISOString(),
      };
      for (const userId of [order.buyerUserId, order.sellerUserId]) {
        await enqueueNotification(tx, { userId, kind: 'DEAL_COMPLETED', payload });
      }
      return;
    }
    if (next.to !== 'FAILED' || !next.failReason) return;
    if (!order.failedAt) throw new Error('Failed order has no time');
    const payload = {
      orderPublicId: order.publicId,
      workTitle: order.workTitleSnapshot,
      amountMinor: order.amountMinor,
      currency: order.currency,
      failReason: next.failReason,
      failedAt: order.failedAt.toISOString(),
      listingType,
      listingId: order.listingId,
    };
    const recipients =
      actor === 'buyer'
        ? [order.sellerUserId]
        : actor === 'seller'
          ? [order.buyerUserId]
          : [order.buyerUserId, order.sellerUserId];
    for (const userId of recipients) {
      await enqueueNotification(tx, { userId, kind: 'ORDER_FAILED', payload });
    }
  }

  private async orderCard(
    db: Prisma.TransactionClient | PrismaService,
    order: StoredOrder,
    viewerId: string,
  ): Promise<OrderDetail> {
    const [viewer, buyer, seller, profile, listing] = await Promise.all([
      db.user.findUnique({
        where: { id: viewerId },
        select: { role: true, status: true },
      }),
      db.user.findUnique({
        where: { id: order.buyerUserId },
        select: contactSelect,
      }),
      db.user.findUnique({
        where: { id: order.sellerUserId },
        select: contactSelect,
      }),
      db.sellerProfile.findUnique({
        where: { userId: order.sellerUserId },
        select: { showContactsToBuyer: true },
      }),
      db.listing.findUnique({
        where: { id: order.listingId },
        select: { contactWindowHours: true },
      }),
    ]);
    const admin = viewer?.role === 'admin' && viewer.status === 'active';
    const role =
      viewerId === order.buyerUserId
        ? 'buyer'
        : viewerId === order.sellerUserId
          ? 'seller'
          : admin
            ? 'admin'
            : null;
    if (!role) throw new NotFoundException('Order not found');
    const showSeller = profile?.showContactsToBuyer !== false;
    const revealContacts = role === 'admin' || order.activatedAt !== null;
    return {
      ...orderSummary(order, role),
      contactDeadlineAt: order.contactDeadlineAt?.toISOString() ?? null,
      offerExpiresAt: order.offerExpiresAt?.toISOString() ?? null,
      buyerComment: order.buyerComment,
      sellerNote: role === 'seller' || role === 'admin' ? order.sellerNote : null,
      failReason: order.failReason,
      faultSide: order.faultSide,
      completedAt: order.completedAt?.toISOString() ?? null,
      failedAt: order.failedAt?.toISOString() ?? null,
      buyerContacts:
        revealContacts && (role === 'seller' || role === 'admin')
          ? partyContacts(buyer)
          : null,
      sellerContacts:
        revealContacts && (role === 'admin' || (role === 'buyer' && showSeller))
          ? partyContacts(seller)
          : null,
      sellerContactHint:
        revealContacts && role === 'buyer' && !showSeller
          ? `Автор свяжется с вами сам в течение ${listing?.contactWindowHours ?? 24} ч`
          : null,
    };
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

const contactSelect = {
  email: true,
  contactPhone: true,
  contactTelegram: true,
  contactInstagram: true,
  contactVk: true,
} satisfies Prisma.UserSelect;

function orderSummary(
  order: StoredOrder,
  role: 'buyer' | 'seller' | 'admin',
) {
  return {
    publicId: order.publicId,
    dealCode: order.dealCode,
    status: order.status,
    source: order.source,
    amountMinor: order.amountMinor,
    currency: currencyOf(order.currency),
    workTitle: order.workTitleSnapshot,
    workPublicId: order.workPublicIdSnapshot,
    role,
    createdAt: order.createdAt.toISOString(),
  };
}

function outcomeData(
  next: OrderTransition,
  actor: OrderActor,
  now: Date,
  contactWindowHours: number,
): Prisma.OrderUpdateManyMutationInput {
  if (next.to === 'ACTIVE') {
    return {
      status: 'ACTIVE',
      activatedAt: now,
      contactDeadlineAt: addHours(now, contactWindowHours),
    };
  }
  if (next.to === 'COMPLETED') {
    return {
      status: 'COMPLETED',
      completedAt: now,
      completedBy: actor === 'admin' ? 'ADMIN' : 'SELLER',
      failReason: null,
      faultSide: null,
      failedAt: null,
      failedBy: null,
    };
  }
  if (!next.failReason) throw orderTransitionNotAllowed();
  return {
    status: 'FAILED',
    failReason: next.failReason,
    faultSide: faultOf(next.failReason),
    failedAt: now,
    failedBy: actor,
    completedAt: null,
    completedBy: null,
  };
}

function offerDecision(
  order: { status: string },
  listing: { type: string; status: string },
  orders: Array<{ status: string; source: string; faultSide: string | null }>,
): 'ok' | 'none' | 'transition' {
  if (listing.type !== 'AUCTION' || listing.status !== 'ENDED') return 'transition';
  if (!orders.some((row) => row.status === 'FAILED' && row.faultSide === 'BUYER')) {
    return 'transition';
  }
  const offers = orders.filter((row) => row.source === 'SECOND_CHANCE').length;
  if (offers >= MAX_SECOND_CHANCE_OFFERS) return 'none';
  if (order.status !== 'FAILED') return 'transition';
  if (orders.some((row) => row.status === 'OFFERED' || row.status === 'ACTIVE')) {
    return 'transition';
  }
  return 'ok';
}

function partyContacts(
  user: Prisma.UserGetPayload<{ select: typeof contactSelect }> | null,
) {
  if (!user) throw new Error('Order party is missing');
  return {
    email: user.email,
    phone: user.contactPhone,
    telegram: user.contactTelegram,
    instagram: user.contactInstagram,
    vk: user.contactVk,
  };
}

function statusLabel(status: string, failReason: string | null | undefined): string {
  return failReason ? `${status}:${failReason}` : status;
}

function orderTransitionNotAllowed(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.ORDER_TRANSITION_NOT_ALLOWED,
    message: 'Order transition is not allowed',
  });
}

function noNextBidder(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.NO_NEXT_BIDDER,
    message: 'No next bidder',
  });
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
      { party: 'seller', kind: 'AUCTION_ENDED' },
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
