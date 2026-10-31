import {
  ApiErrorCode,
  bidHistoryResponseSchema,
  COMMERCE_LIMITS,
  type Currency,
  type PlaceBidRequest,
  type PublicLot,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { Injectable, type OnModuleInit } from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import {
  PrismaService,
  RetryableTransactionConflict,
  runReadCommittedTransaction,
} from '../core/database';
import { AppException } from '../core/errors';
import { dbNow } from '../core/time';
import { enqueueNotification } from '../notifications/notification-outbox';
import { lockProductRowForUpdate } from '../products/product-write-guard';
import {
  minimumBidMinor,
  minimumStepUnitMinor,
  resolveSoftCloseEndsAt,
} from './auction-pricing';
import { CommerceGuards, type BuyerListing } from './commerce-guards';
import { toPublicLot, visibleOrderStatus } from './commerce.mapper';
import { OPEN_LISTING_STATUSES } from './listing-state';

const BID_HISTORY_LIMIT = 20;
const VOID_REASON_BANNED = 'BANNED';

export type PlaceBidResult = {
  bid: {
    id: string;
    amountMinor: number;
    createdAt: string;
    participantLabel: string;
  };
  lot: PublicLot;
};

type PlaceBidInput = PlaceBidRequest & {
  ip: string;
  browserId: string | null;
  checkTurnstile: boolean;
};

const listingSelect = {
  id: true,
  productId: true,
  sellerUserId: true,
  type: true,
  status: true,
  currency: true,
  startsAt: true,
  endsAt: true,
  originalEndsAt: true,
  contactWindowHours: true,
  currentPriceMinor: true,
  bidCount: true,
  priceMinor: true,
  auctionRules: true,
  product: { select: { title: true } },
  orders: { select: { status: true } },
} satisfies Prisma.ListingSelect;

type AuctionListing = Prisma.ListingGetPayload<{ select: typeof listingSelect }>;

@Injectable()
export class BidsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guards: CommerceGuards,
    private readonly antifraud: AntifraudService,
  ) {}

  onModuleInit(): void {
    this.antifraud.onBan({
      lockProducts: (tx, userId) => this.lockRunningAuctionProducts(tx, userId),
      voidBids: (tx, userId, lockedProductIds) =>
        this.voidRunningAuctionBids(tx, userId, lockedProductIds),
    });
  }

  async placeBid(
    userId: string,
    listingId: string,
    input: PlaceBidInput,
  ): Promise<PlaceBidResult> {
    const turnstile = input.checkTurnstile
      ? await this.antifraud.verifySignal('bid', input.turnstileToken, input.ip)
      : 'skip';
    const anchor = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { productId: true },
    });
    if (!anchor) throw listingNotFound();

    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, anchor.productId);
      const seller = await tx.listing.findUnique({
        where: { id: listingId },
        select: { sellerUserId: true },
      });
      if (!seller) throw listingNotFound();
      await this.antifraud.lockUsers(tx, [userId, seller.sellerUserId]);
      const now = await dbNow(tx);
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: listingSelect,
      });
      if (!listing) throw listingNotFound();
      const existing = await tx.bid.findFirst({
        where: {
          listingId,
          bidderUserId: userId,
          idempotencyKey: input.idempotencyKey,
        },
      });
      if (existing) {
        if (existing.amountMinor !== input.amountMinor) {
          throw new AppException({
            status: 409,
            code: ApiErrorCode.IDEMPOTENCY_KEY_REUSED,
            message: 'Idempotency key was reused with a different payload',
          });
        }
        // Replaying a voided bid with the same key and amount returns that stored
        // bid. The lot was re-read in this transaction, so its price and bidCount
        // already exclude voided rows. Public history omits the voided row and
        // keeps the participant number from the first bid, including voided ones.
        return this.present(tx, listing, existing, now);
      }

      const buyerListing = asBuyerListing(listing);
      await this.guards.assertBuyerEligible(tx, {
        userId,
        listing: buyerListing,
        now,
        userLocked: true,
      });
      if (!(await this.guards.sellerMaySell(tx, listing.sellerUserId))) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.LISTING_NOT_OPEN,
          message: 'Listing is not open',
        });
      }
      assertAuctionAmount(listing, input.amountMinor);

      const previous = await tx.bid.findFirst({
        where: { listingId, voidedAt: null },
        orderBy: [{ amountMinor: 'desc' }, { createdAt: 'asc' }],
        select: { bidderUserId: true },
      });
      const bid = await tx.bid.create({
        data: {
          listingId,
          bidderUserId: userId,
          amountMinor: input.amountMinor,
          idempotencyKey: input.idempotencyKey,
          createdAt: now,
        },
      });
      const endsAt = nextEndsAt(listing, now);
      const updated = await tx.listing.updateMany({
        where: {
          id: listing.id,
          status: { in: [...OPEN_LISTING_STATUSES] },
          bidCount: listing.bidCount,
        },
        data: {
          currentPriceMinor: input.amountMinor,
          bidCount: { increment: 1 },
          endsAt,
        },
      });
      if (updated.count !== 1) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.LISTING_CHANGED,
          message: 'Listing changed while placing bid',
        });
      }
      if (previous && previous.bidderUserId !== userId) {
        await enqueueNotification(tx, {
          userId: previous.bidderUserId,
          kind: 'OUTBID',
          payload: {
            bidId: bid.id,
            listingId: listing.id,
            ...(listing.product.title ? { workTitle: listing.product.title } : {}),
          },
        });
      }
      await this.antifraud.recordBidSignals(tx, {
        userId,
        listingId: listing.id,
        sellerUserId: listing.sellerUserId,
        bidCreatedAt: bid.createdAt,
        turnstile,
        browserId: input.browserId,
      });
      return this.present(
        tx,
        {
          ...listing,
          currentPriceMinor: input.amountMinor,
          bidCount: listing.bidCount + 1,
          endsAt,
        },
        bid,
        now,
      );
    });
  }

  async list(listingId: string): Promise<{
    bids: Array<{
      amountMinor: number;
      createdAt: string;
      participantLabel: string;
    }>;
  }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw listingNotFound();
    const rows = await this.prisma.$queryRaw<
      Array<{
        amountMinor: number;
        createdAt: Date;
        participantLabel: string;
      }>
    >`
      WITH first_bids AS (
        SELECT DISTINCT ON (bidder_user_id)
          bidder_user_id, created_at, id
        FROM bids
        WHERE listing_id = ${listingId}::uuid
        ORDER BY bidder_user_id, created_at ASC, id ASC
      ),
      ranked AS (
        SELECT bidder_user_id,
               row_number() OVER (ORDER BY created_at ASC, id ASC) AS n
        FROM first_bids
      )
      SELECT b.amount_minor AS "amountMinor",
             b.created_at AS "createdAt",
             ('Участник ' || ranked.n::text) AS "participantLabel"
      FROM bids b
      JOIN ranked ON ranked.bidder_user_id = b.bidder_user_id
      WHERE b.listing_id = ${listingId}::uuid
        AND b.voided_at IS NULL
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT ${BID_HISTORY_LIMIT}
    `;
    return bidHistoryResponseSchema.parse({
      bids: rows.map((row) => ({
        amountMinor: row.amountMinor,
        createdAt: new Date(row.createdAt).toISOString(),
        participantLabel: row.participantLabel,
      })),
    });
  }

  private async lockRunningAuctionProducts(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<readonly string[]> {
    const productIds = await runningAuctionProductIds(tx, userId);
    for (const productId of productIds) {
      await lockProductRowForUpdate(tx, productId);
    }
    return productIds;
  }

  private async voidRunningAuctionBids(
    tx: Prisma.TransactionClient,
    userId: string,
    lockedProductIds: ReadonlySet<string>,
  ): Promise<void> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    if (user?.status !== 'banned') return;
    const productIds = await runningAuctionProductIds(tx, userId);
    if (productIds.some((productId) => !lockedProductIds.has(productId))) {
      throw new RetryableTransactionConflict();
    }
    const now = await dbNow(tx);
    for (const productId of productIds) {
      const listings = await tx.listing.findMany({
        where: {
          productId,
          type: 'AUCTION',
          status: { in: [...OPEN_LISTING_STATUSES] },
        },
        select: { id: true },
      });
      for (const listing of listings) {
        await tx.bid.updateMany({
          where: { listingId: listing.id, bidderUserId: userId, voidedAt: null },
          data: { voidedAt: now, voidReason: VOID_REASON_BANNED },
        });
        await recomputeAuction(tx, listing.id);
      }
    }
  }

  private async present(
    tx: Prisma.TransactionClient,
    listing: AuctionListing,
    bid: { id: string; amountMinor: number; createdAt: Date; bidderUserId: string },
    now: Date,
  ): Promise<PlaceBidResult> {
    const participantLabel = await bidderLabel(tx, listing.id, bid.bidderUserId);
    const view = await this.guards.describeBuyer(tx, {
      userId: bid.bidderUserId,
      listing: asBuyerListing(listing),
      now,
    });
    return {
      bid: {
        id: bid.id,
        amountMinor: bid.amountMinor,
        createdAt: bid.createdAt.toISOString(),
        participantLabel,
      },
      lot: toPublicLot({
        listing,
        startPriceMinor: listing.auctionRules?.startPriceMinor ?? null,
        now,
        orderStatus: visibleOrderStatus(listing.orders),
        viewer: {
          role: 'buyer',
          isLeading: view.isLeading,
          blockedReason: view.blockedReason,
        },
      }),
    };
  }

}

async function runningAuctionProductIds(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<string[]> {
  const rows = await tx.bid.findMany({
    where: {
      bidderUserId: userId,
      voidedAt: null,
      listing: {
        type: 'AUCTION',
        status: { in: [...OPEN_LISTING_STATUSES] },
      },
    },
    select: { listing: { select: { productId: true } } },
  });
  return [...new Set(rows.map((row) => row.listing.productId))].sort();
}

async function bidderLabel(
  tx: Prisma.TransactionClient,
  listingId: string,
  bidderUserId: string,
): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ label: string }>>`
    WITH first_bids AS (
      SELECT DISTINCT ON (bidder_user_id)
        bidder_user_id, created_at, id
      FROM bids
      WHERE listing_id = ${listingId}::uuid
      ORDER BY bidder_user_id, created_at ASC, id ASC
    ),
    ranked AS (
      SELECT bidder_user_id,
             row_number() OVER (ORDER BY created_at ASC, id ASC) AS n
      FROM first_bids
    )
    SELECT ('Участник ' || n::text) AS label
    FROM ranked
    WHERE bidder_user_id = ${bidderUserId}::uuid
  `;
  const label = rows[0]?.label;
  if (!label) throw new Error('Bid participant label is missing');
  return label;
}

function asBuyerListing(listing: AuctionListing): BuyerListing {
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

function assertAuctionAmount(listing: AuctionListing, amountMinor: number): void {
  if (listing.type !== 'AUCTION') {
    throw new AppException({
      status: 409,
      code: ApiErrorCode.LISTING_NOT_OPEN,
      message: 'Listing is not open',
    });
  }
  if (!listing.auctionRules) throw new Error('Auction rules are missing');
  const currency = currencyOf(listing.currency);
  const step = minimumStepUnitMinor(currency);
  if (amountMinor > COMMERCE_LIMITS.maxAmountMinor || amountMinor % step !== 0) {
    throw new AppException({
      status: 400,
      code: ApiErrorCode.BID_AMOUNT_INVALID,
      message: 'Bid amount is invalid',
    });
  }
  const minimum = minimumBidMinor({
    currency,
    startPriceMinor: listing.auctionRules.startPriceMinor,
    currentPriceMinor: listing.currentPriceMinor,
    bidCount: listing.bidCount,
  });
  if (amountMinor < minimum) {
    throw new AppException({
      status: 409,
      code: ApiErrorCode.BID_TOO_LOW,
      message: 'Bid is below the minimum',
    });
  }
}

function nextEndsAt(listing: AuctionListing, now: Date): Date | null {
  if (
    !listing.endsAt ||
    !listing.originalEndsAt ||
    !listing.auctionRules
  ) {
    return listing.endsAt;
  }
  return resolveSoftCloseEndsAt({
    endsAt: listing.endsAt,
    originalEndsAt: listing.originalEndsAt,
    now,
    windowSeconds: listing.auctionRules.softCloseWindowSeconds,
    extensionSeconds: listing.auctionRules.softCloseExtensionSeconds,
    maxTotalSeconds: listing.auctionRules.softCloseMaxTotalSeconds,
  });
}

function currencyOf(value: string): Currency {
  if (value === 'BYN' || value === 'RUB') return value;
  throw new Error(`Unsupported listing currency ${value}`);
}

async function recomputeAuction(
  tx: Prisma.TransactionClient,
  listingId: string,
): Promise<void> {
  const listing = await tx.listing.findUnique({
    where: { id: listingId },
    select: {
      status: true,
      type: true,
      auctionRules: { select: { startPriceMinor: true } },
    },
  });
  if (!listing || listing.type !== 'AUCTION') return;
  if (listing.status !== 'SCHEDULED' && listing.status !== 'LIVE') return;
  if (!listing.auctionRules) throw new Error('Auction rules are missing');
  const top = await tx.bid.findFirst({
    where: { listingId, voidedAt: null },
    orderBy: [{ amountMinor: 'desc' }, { createdAt: 'asc' }],
    select: { amountMinor: true },
  });
  const bidCount = await tx.bid.count({
    where: { listingId, voidedAt: null },
  });
  const updated = await tx.listing.updateMany({
    where: { id: listingId, status: { in: [...OPEN_LISTING_STATUSES] } },
    data: {
      currentPriceMinor: top?.amountMinor ?? listing.auctionRules.startPriceMinor,
      bidCount,
    },
  });
  if (updated.count !== 1) {
    throw new Error('Running auction price was not recomputed');
  }
}

function listingNotFound(): AppException {
  return new AppException({
    status: 404,
    code: ApiErrorCode.LISTING_NOT_FOUND,
    message: 'Listing not found',
  });
}
