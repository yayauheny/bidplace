import {
  EFFECTIVE_LISTING_STATES,
  type ListingStatus,
  type ListingType,
} from '@bidplace/contracts';

export type EffectiveListingState = (typeof EFFECTIVE_LISTING_STATES)[number];

export const OPEN_LISTING_STATUSES = ['SCHEDULED', 'LIVE'] as const;

export function authorCancelWhere(listing: { type: ListingType }): {
  statuses: typeof OPEN_LISTING_STATUSES;
  bidCount: 0 | null;
} {
  return {
    statuses: OPEN_LISTING_STATUSES,
    bidCount: listing.type === 'AUCTION' ? 0 : null,
  };
}

export function effectiveListingState(
  listing: { status: ListingStatus; startsAt: Date; endsAt: Date | null },
  now: Date,
): EffectiveListingState {
  if (listing.status === 'CANCELLED') return 'CANCELLED';
  if (listing.status === 'ENDED') return 'ENDED';
  const started = listing.startsAt.getTime() <= now.getTime();
  const due =
    listing.endsAt !== null && listing.endsAt.getTime() <= now.getTime();
  if (started && due) return 'AWAITING_CLOSE';
  if (started) return 'LIVE';
  return 'SCHEDULED';
}

export function canAuthorCancel(
  listing: { type: ListingType; status: ListingStatus; bidCount: number },
  now: Date,
): boolean {
  if (!Number.isFinite(now.getTime())) return false;
  if (
    !(OPEN_LISTING_STATUSES as readonly ListingStatus[]).includes(
      listing.status,
    )
  ) {
    return false;
  }
  if (listing.type === 'AUCTION' && listing.bidCount > 0) return false;
  return true;
}
