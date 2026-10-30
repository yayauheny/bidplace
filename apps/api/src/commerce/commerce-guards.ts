import {
  ApiErrorCode,
  type ApiErrorCode as ApiErrorCodeValue,
  type ListingStatus,
  type ListingType,
} from '@bidplace/contracts';
import { Prisma } from '@bidplace/database';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AntifraudService, type ActorAction } from '../antifraud';
import { AppException } from '../core/errors';
import { dbNow } from '../core/time';
import { effectiveListingState } from './listing-state';

export type BuyerListing = {
  id: string;
  sellerUserId: string;
  type: ListingType;
  status: ListingStatus;
  startsAt: Date;
  endsAt: Date | null;
  bidCount: number;
};

export type BuyerView = {
  blockedReason: ApiErrorCodeValue | null;
  isLeading: boolean;
};

@Injectable()
export class CommerceGuards {
  constructor(private readonly antifraud: AntifraudService) {}

  async assertBuyerEligible(
    tx: Prisma.TransactionClient,
    input: {
      userId: string;
      listing: BuyerListing;
      now?: Date;
      userLocked?: boolean;
      action?: ActorAction;
    },
  ): Promise<void> {
    if (!input.userLocked) {
      await this.antifraud.lockUsers(tx, [input.userId]);
    }
    const now = input.now ?? (await dbNow(tx));
    const view = await this.describeBuyer(tx, {
      userId: input.userId,
      listing: input.listing,
      now,
    });
    if (view.blockedReason) throw buyerBlockException(view.blockedReason);
    await this.antifraud.assertCanAct(tx, input.userId, input.action ?? 'bid');
  }

  async describeBuyer(
    tx: Prisma.TransactionClient,
    input: { userId: string; listing: BuyerListing; now: Date },
  ): Promise<BuyerView> {
    const isLeading =
      input.listing.type === 'AUCTION' &&
      (await this.leadingBid(tx, input.listing.id, input.userId));
    const state = effectiveListingState(input.listing, input.now);
    if (state !== 'LIVE') {
      return { blockedReason: ApiErrorCode.LISTING_NOT_OPEN, isLeading };
    }
    if (input.listing.sellerUserId === input.userId) {
      return { blockedReason: ApiErrorCode.SELF_BID_FORBIDDEN, isLeading };
    }

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: {
        role: true,
        status: true,
        emailVerifiedAt: true,
        purchaseHolds: {
          where: { releasedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') {
      return { blockedReason: ApiErrorCode.ADMIN_BID_FORBIDDEN, isLeading };
    }
    if (user.status !== 'active' || user.purchaseHolds.length > 0) {
      return { blockedReason: ApiErrorCode.BUYER_BLOCKED, isLeading };
    }
    if (!user.emailVerifiedAt) {
      return {
        blockedReason: ApiErrorCode.EMAIL_VERIFICATION_REQUIRED,
        isLeading,
      };
    }
    if (isLeading) {
      return { blockedReason: ApiErrorCode.BID_ALREADY_LEADING, isLeading };
    }
    return { blockedReason: null, isLeading };
  }

  private async leadingBid(
    tx: Prisma.TransactionClient,
    listingId: string,
    userId: string,
  ): Promise<boolean> {
    const top = await tx.bid.findFirst({
      where: { listingId, voidedAt: null },
      orderBy: [{ amountMinor: 'desc' }, { createdAt: 'asc' }],
      select: { bidderUserId: true },
    });
    return top?.bidderUserId === userId;
  }
}

function buyerBlockException(code: ApiErrorCodeValue): AppException {
  const status =
    code === ApiErrorCode.LISTING_NOT_OPEN ||
    code === ApiErrorCode.BID_ALREADY_LEADING
      ? 409
      : 403;
  const message =
    code === ApiErrorCode.LISTING_NOT_OPEN
      ? 'Listing is not open'
      : code === ApiErrorCode.SELF_BID_FORBIDDEN
        ? 'Cannot bid on your own listing'
        : code === ApiErrorCode.ADMIN_BID_FORBIDDEN
          ? 'Administrators cannot place bids'
          : code === ApiErrorCode.BID_ALREADY_LEADING
            ? 'Bidder is already leading'
            : code === ApiErrorCode.BUYER_BLOCKED
              ? 'Purchases are blocked'
              : code === ApiErrorCode.EMAIL_VERIFICATION_REQUIRED
                ? 'Email verification is required'
                : 'Listing action is not allowed';
  return new AppException({ status, code, message });
}
