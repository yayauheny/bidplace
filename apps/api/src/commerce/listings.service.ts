import {
  ApiErrorCode,
  COMMERCE_LIMITS,
  type AdminRemoveListingRequest,
  type CreateListingRequest,
  type Currency,
  type ListingStatus,
  type ListingType,
  type OrderStatus,
  type PublicLot,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AntifraudService } from '../antifraud';
import {
  PrismaService,
  prismaUniqueTargets,
  runReadCommittedTransaction,
} from '../core/database';
import { AppException } from '../core/errors';
import { dbNow } from '../core/time';
import { enqueueNotification } from '../notifications/notification-outbox';
import { portfolioCatalogProductWhere } from '../products/public-visibility';
import {
  lockProductRowForUpdate,
  OPEN_ORDER_STATUSES,
} from '../products/product-write-guard';
import { assertApprovedSeller } from '../sellers/seller-capability';
import { bidStepMinor } from './auction-pricing';
import { type BuyerListing, CommerceGuards } from './commerce-guards';
import { toPublicLot, visibleOrderStatus } from './commerce.mapper';
import {
  authorCancelWhere,
  canAuthorCancel,
  OPEN_LISTING_STATUSES,
} from './listing-state';

const DAY_MS = 24 * 60 * 60 * 1000;

const saleProductSelect = {
  id: true,
  deletedAt: true,
  publicId: true,
  title: true,
  status: true,
  publishedRevisionId: true,
  sellerProfile: {
    select: {
      userId: true,
      status: true,
      user: { select: { status: true, emailVerifiedAt: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type SaleProduct = Prisma.ProductGetPayload<{
  select: typeof saleProductSelect;
}>;

export type CreatedListing = {
  id: string;
  status: ListingStatus;
  type: ListingType;
  contactWindowHours: number;
  startsAt: string;
  endsAt: string | null;
};

export type CancelledListing = {
  id: string;
  status: 'CANCELLED';
  cancelReason: 'AUTHOR_WITHDREW' | 'ADMIN_REMOVED';
};

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guards: CommerceGuards,
    private readonly antifraud: AntifraudService,
  ) {}

  create(
    userId: string,
    productId: string,
    input: CreateListingRequest,
  ): Promise<CreatedListing> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      await lockProductRowForUpdate(tx, productId);
      const now = await dbNow(tx);
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: saleProductSelect,
      });
      this.assertSellerCanList(product, userId);
      await this.assertProductCanBeListed(tx, productId);
      const schedule = listingSchedule(input, now);
      try {
        const created = await tx.listing.create({
          data: {
            productId,
            sellerUserId: userId,
            type: input.type,
            status: schedule.status,
            currency: input.currency,
            priceMinor: input.type === 'FIXED' ? input.priceMinor : null,
            startsAt: schedule.startsAt,
            endsAt: schedule.endsAt,
            originalEndsAt: schedule.endsAt,
            contactWindowHours: input.contactWindowHours,
            currentPriceMinor:
              input.type === 'AUCTION' ? input.startPriceMinor : null,
            bidCount: 0,
            ...(input.type === 'AUCTION'
              ? {
                  auctionRules: {
                    create: {
                      startPriceMinor: input.startPriceMinor,
                      stepTableCode: stepTableCode(input.currency),
                    },
                  },
                }
              : {}),
          },
        });
        return {
          id: created.id,
          status: created.status,
          type: created.type,
          contactWindowHours: created.contactWindowHours,
          startsAt: created.startsAt.toISOString(),
          endsAt: created.endsAt?.toISOString() ?? null,
        };
      } catch (error) {
        if (
          prismaUniqueTargets(error).includes('one_active_listing_per_product')
        ) {
          throw inSale();
        }
        throw error;
      }
    });
  }

  cancelByAuthor(userId: string, listingId: string): Promise<CancelledListing> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const located = await tx.listing.findUnique({
        where: { id: listingId },
        select: { productId: true },
      });
      if (!located) throw listingNotFound();
      await lockProductRowForUpdate(tx, located.productId);
      const now = await dbNow(tx);
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: listingCancelSelect,
      });
      if (!listing || listing.sellerUserId !== userId) throw listingNotFound();
      if (!canAuthorCancel(listing, now)) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.CONFLICT,
          message: 'Listing cannot be withdrawn',
        });
      }
      const filter = authorCancelWhere(listing);
      const updated = await tx.listing.updateMany({
        where: {
          id: listing.id,
          status: { in: [...filter.statuses] },
          ...(filter.bidCount === null ? {} : { bidCount: filter.bidCount }),
        },
        data: {
          status: 'CANCELLED',
          cancelReason: 'AUTHOR_WITHDREW',
          cancelledAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.LISTING_CHANGED,
          message: 'Listing changed',
        });
      }
      return {
        id: listing.id,
        status: 'CANCELLED',
        cancelReason: 'AUTHOR_WITHDREW',
      };
    });
  }

  removeByAdmin(
    adminId: string,
    listingId: string,
    input: AdminRemoveListingRequest,
  ): Promise<CancelledListing> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const located = await tx.listing.findUnique({
        where: { id: listingId },
        select: { productId: true },
      });
      if (!located) throw listingNotFound();
      await lockProductRowForUpdate(tx, located.productId);
      await this.antifraud.lockUsers(tx, [adminId]);
      const now = await dbNow(tx);
      const admin = await tx.user.findUnique({
        where: { id: adminId },
        select: { role: true, status: true },
      });
      if (admin?.role !== 'admin' || admin.status !== 'active') {
        throw new ForbiddenException('Active admin required');
      }
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: listingCancelSelect,
      });
      if (!listing) throw listingNotFound();
      if (
        !(OPEN_LISTING_STATUSES as readonly ListingStatus[]).includes(
          listing.status,
        )
      ) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.LISTING_NOT_OPEN,
          message: 'Listing is not open',
        });
      }
      const updated = await tx.listing.updateMany({
        where: {
          id: listing.id,
          status: { in: [...OPEN_LISTING_STATUSES] },
        },
        data: {
          status: 'CANCELLED',
          cancelReason: 'ADMIN_REMOVED',
          cancelledAt: now,
        },
      });
      if (updated.count !== 1) {
        throw new AppException({
          status: 409,
          code: ApiErrorCode.LISTING_CHANGED,
          message: 'Listing changed',
        });
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: adminId,
          targetType: 'LISTING',
          targetId: listing.id,
          oldStatus: listing.status,
          newStatus: 'CANCELLED',
          reason: input.reason,
          action: 'ADMIN_REMOVED',
        },
      });
      if (listing.type === 'AUCTION') {
        await enqueueAuctionRemoved(tx, listing);
      }
      return {
        id: listing.id,
        status: 'CANCELLED',
        cancelReason: 'ADMIN_REMOVED',
      };
    });
  }

  getPublicLot(
    publicId: string,
    viewerUserId: string | null,
  ): Promise<PublicLot | null> {
    return runReadCommittedTransaction(this.prisma, async (tx) => {
      const now = await dbNow(tx);
      const product = await tx.product.findFirst({
        where: { publicId, ...portfolioCatalogProductWhere },
        select: { id: true },
      });
      if (!product) throw new NotFoundException('Work not found');
      const listings = await tx.listing.findMany({
        where: { productId: product.id },
        include: {
          auctionRules: { select: { startPriceMinor: true } },
          orders: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      const listing = choosePublicListing(listings);
      if (!listing) return null;
      const orderStatus = visibleOrderStatus(listingsOrders(listing));
      const viewer = viewerUserId
        ? await this.viewer(tx, viewerUserId, listing, now)
        : null;
      return toPublicLot({
        listing,
        startPriceMinor: listing.auctionRules?.startPriceMinor ?? null,
        now,
        orderStatus,
        viewer,
      });
    });
  }

  private assertSellerCanList(
    product: SaleProduct | null,
    userId: string,
  ): asserts product is SaleProduct {
    if (!product || product.deletedAt)
      throw new NotFoundException('Product not found');
    if (product.sellerProfile.userId !== userId) {
      throw new ForbiddenException('Product is not owned by user');
    }
    assertApprovedSeller(product.sellerProfile.status);
    if (product.sellerProfile.user.status !== 'active') {
      throw new ForbiddenException('Active user is required');
    }
    if (!product.sellerProfile.user.emailVerifiedAt) {
      throw new AppException({
        status: 403,
        code: ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
        message: 'Email verification is required',
      });
    }
    if (product.status !== 'APPROVED' || product.publishedRevisionId === null) {
      throw new AppException({
        status: 409,
        code: ApiErrorCode.PRODUCT_STATE_CONFLICT,
        message: 'Product is not published',
      });
    }
  }

  private async assertProductCanBeListed(
    tx: Prisma.TransactionClient,
    productId: string,
  ): Promise<void> {
    const sold = await tx.order.findFirst({
      where: { productId, status: 'COMPLETED' },
      select: { id: true },
    });
    if (sold) {
      throw new AppException({
        status: 409,
        code: ApiErrorCode.PRODUCT_ALREADY_SOLD,
        message: 'Product is already sold',
      });
    }
    const open = await tx.order.findFirst({
      where: { productId, status: { in: [...OPEN_ORDER_STATUSES] } },
      select: { id: true },
    });
    if (open) throw inSale();
    const active = await tx.listing.findFirst({
      where: {
        productId,
        status: { in: [...OPEN_LISTING_STATUSES] },
      },
      select: { id: true },
    });
    if (active) throw inSale();
  }

  private async viewer(
    tx: Prisma.TransactionClient,
    userId: string,
    listing: BuyerListing,
    now: Date,
  ): Promise<PublicLot['viewer']> {
    const view = await this.guards.describeBuyer(tx, {
      userId,
      listing,
      now,
    });
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const role =
      user?.role === 'admin'
        ? 'admin'
        : userId === listing.sellerUserId
          ? 'seller'
          : 'buyer';
    return {
      role,
      isLeading: view.isLeading,
      blockedReason: view.blockedReason,
    };
  }
}

const listingCancelSelect = {
  id: true,
  productId: true,
  sellerUserId: true,
  type: true,
  status: true,
  bidCount: true,
  startsAt: true,
  endsAt: true,
} satisfies Prisma.ListingSelect;

function listingSchedule(input: CreateListingRequest, now: Date) {
  const requested = new Date(input.startsAt);
  if (Number.isNaN(requested.getTime())) {
    throw invalidListing('startsAt is not a time');
  }
  if (
    requested.getTime() >
    now.getTime() + COMMERCE_LIMITS.scheduleMaxDays * DAY_MS
  ) {
    throw invalidListing('startsAt is further than 30 days');
  }
  if (input.type === 'FIXED' && requested.getTime() > now.getTime()) {
    throw invalidListing('Fixed price starts now');
  }
  const scheduled =
    input.type === 'AUCTION' && requested.getTime() > now.getTime();
  const startsAt = scheduled ? requested : now;
  const endsAt = input.type === 'AUCTION' ? new Date(input.endsAt) : null;
  if (input.type === 'AUCTION') {
    if (!endsAt || Number.isNaN(endsAt.getTime())) {
      throw invalidListing('endsAt is not a time');
    }
    const span = endsAt.getTime() - startsAt.getTime();
    if (
      span < COMMERCE_LIMITS.auctionMinDays * DAY_MS ||
      span > COMMERCE_LIMITS.auctionMaxDays * DAY_MS
    ) {
      throw invalidListing('Auction length must be from 1 to 14 days');
    }
    if (
      input.startPriceMinor %
        bidStepMinor(input.currency, input.startPriceMinor) !==
      0
    ) {
      throw invalidListing('Start price must be a multiple of the bid step');
    }
  }
  return {
    startsAt,
    endsAt,
    status: (scheduled ? 'SCHEDULED' : 'LIVE') as ListingStatus,
  };
}

function stepTableCode(currency: Currency): string {
  return currency === 'BYN' ? 'BYN_V1' : 'RUB_V1';
}

function invalidListing(message: string): AppException {
  return new AppException({
    status: 400,
    code: ApiErrorCode.VALIDATION_ERROR,
    message,
  });
}

function inSale(): AppException {
  return new AppException({
    status: 409,
    code: ApiErrorCode.PRODUCT_IN_SALE,
    message: 'Product is in sale',
  });
}

function listingNotFound(): AppException {
  return new AppException({
    status: 404,
    code: ApiErrorCode.LISTING_NOT_FOUND,
    message: 'Listing not found',
  });
}

function listingsOrders(listing: {
  orders: Array<{ status: OrderStatus }>;
}): Array<{ status: OrderStatus }> {
  return listing.orders;
}

function choosePublicListing<
  T extends {
    status: ListingStatus;
    orders: Array<{ status: OrderStatus }>;
  },
>(listings: T[]): T | null {
  const open = listings.find((listing) =>
    (OPEN_LISTING_STATUSES as readonly ListingStatus[]).includes(
      listing.status,
    ),
  );
  if (open) return open;
  const sold = listings.find((listing) =>
    listing.orders.some((order) => order.status === 'COMPLETED'),
  );
  if (sold) return sold;
  return (
    listings.find((listing) =>
      listing.orders.some(
        (order) => order.status === 'OFFERED' || order.status === 'ACTIVE',
      ),
    ) ?? null
  );
}

async function enqueueAuctionRemoved(
  tx: Prisma.TransactionClient,
  listing: { id: string; productId: string; sellerUserId: string },
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: listing.productId },
    select: { title: true },
  });
  const bids = await tx.bid.findMany({
    where: { listingId: listing.id, voidedAt: null },
    select: { bidderUserId: true },
  });
  const recipients = new Set<string>([listing.sellerUserId]);
  for (const bid of bids) recipients.add(bid.bidderUserId);
  const workTitle = product?.title?.trim() || 'Работа';
  for (const userId of recipients) {
    await enqueueNotification(tx, {
      userId,
      kind: 'LISTING_REMOVED',
      payload: { listingId: listing.id, workTitle },
    });
  }
}
