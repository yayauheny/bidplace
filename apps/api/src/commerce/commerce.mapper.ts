import {
  LOT_MARKS,
  publicLotSchema,
  type Currency,
  type ListingType,
  type OrderStatus,
  type PublicLot,
} from '@bidplace/contracts';

import { minimumBidMinor } from './auction-pricing';
import {
  effectiveListingState,
  type EffectiveListingState,
} from './listing-state';

type LotMark = (typeof LOT_MARKS)[number];

function currencyOf(value: string): Currency {
  if (value === 'BYN' || value === 'RUB') return value;
  throw new Error(`Unsupported listing currency ${value}`);
}

export function lotMark(
  effective: EffectiveListingState,
  type: ListingType,
  orderStatus: OrderStatus | null,
): LotMark | null {
  if (orderStatus === 'COMPLETED') return 'SOLD';
  if (orderStatus === 'OFFERED' || orderStatus === 'ACTIVE') return 'RESERVED';
  if (effective === 'LIVE' && type === 'FIXED') return 'BUY';
  if (effective === 'LIVE' && type === 'AUCTION') return 'AUCTION';
  if (effective === 'SCHEDULED') return 'SCHEDULED';
  return null;
}

export function visibleOrderStatus(
  orders: ReadonlyArray<{ status: OrderStatus }>,
): OrderStatus | null {
  if (orders.some((order) => order.status === 'COMPLETED')) return 'COMPLETED';
  const open = orders.find(
    (order) => order.status === 'OFFERED' || order.status === 'ACTIVE',
  );
  return open?.status ?? null;
}

export function toPublicLot(input: {
  listing: {
    id: string;
    type: ListingType;
    status: Parameters<typeof effectiveListingState>[0]['status'];
    currency: string;
    priceMinor: number | null;
    currentPriceMinor: number | null;
    bidCount: number;
    startsAt: Date;
    endsAt: Date | null;
    contactWindowHours: number;
  };
  startPriceMinor: number | null;
  now: Date;
  orderStatus: OrderStatus | null;
  viewer: PublicLot['viewer'];
}): PublicLot {
  const currency = currencyOf(input.listing.currency);
  const effectiveStatus = effectiveListingState(input.listing, input.now);
  const priceMinor =
    input.listing.type === 'FIXED'
      ? input.listing.priceMinor
      : input.listing.currentPriceMinor;
  const minimum =
    input.listing.type === 'AUCTION' && input.startPriceMinor !== null
      ? minimumBidMinor({
          currency,
          startPriceMinor: input.startPriceMinor,
          currentPriceMinor: input.listing.currentPriceMinor,
          bidCount: input.listing.bidCount,
        })
      : null;

  return publicLotSchema.parse({
    id: input.listing.id,
    type: input.listing.type,
    effectiveStatus,
    currency,
    priceMinor,
    minimumBidMinor: minimum,
    bidCount: input.listing.bidCount,
    startsAt: input.listing.startsAt.toISOString(),
    endsAt: input.listing.endsAt?.toISOString() ?? null,
    contactWindowHours: input.listing.contactWindowHours,
    mark: lotMark(effectiveStatus, input.listing.type, input.orderStatus),
    serverNow: input.now.toISOString(),
    viewer: input.viewer,
  });
}
