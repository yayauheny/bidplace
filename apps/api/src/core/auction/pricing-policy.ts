import { Decimal } from '@bidplace/database';

import { type Bid } from '@bidplace/contracts';

export type AuctionBidLike = {
  id: string;
  amount: Decimal;
  status: Bid['status'];
  createdAt: Date;
};

const ZERO_DECIMAL = new Decimal(0);

const BID_STEP_RULES = [
  { upperBound: new Decimal(25), step: new Decimal('0.5') },
  { upperBound: new Decimal(100), step: new Decimal(1) },
  { upperBound: new Decimal(500), step: new Decimal(5) },
  { upperBound: new Decimal(1000), step: new Decimal(10) },
] as const;

export const eligibleBidStatuses = [
  'active',
  'winning',
  'outbid',
] as const satisfies readonly Bid['status'][];

export function isEligibleBidStatus(status: Bid['status']): boolean {
  return (eligibleBidStatuses as readonly Bid['status'][]).includes(status);
}

export function calculateBidStep(amount: Decimal): Decimal {
  for (const rule of BID_STEP_RULES) {
    if (amount.lt(rule.upperBound)) {
      return rule.step;
    }
  }

  return new Decimal(25);
}

export function resolveMinimumNextBid(currentPrice: Decimal): Decimal {
  return currentPrice.add(calculateBidStep(currentPrice));
}

export function resolveCurrentPrice(
  startPrice: Decimal,
  highestEligibleBid: Decimal | null,
): Decimal {
  return highestEligibleBid ?? startPrice;
}

export function reserveReached(
  currentPrice: Decimal,
  reservePrice: Decimal,
): boolean {
  return currentPrice.gte(reservePrice);
}

export function findHighestEligibleBid<T extends AuctionBidLike>(
  bids: readonly T[],
): T | null {
  const eligibleBids = bids.filter((bid) => isEligibleBidStatus(bid.status));

  if (eligibleBids.length === 0) {
    return null;
  }

  let currentWinner = eligibleBids[0]!;

  for (let index = 1; index < eligibleBids.length; index += 1) {
    const candidate = eligibleBids[index]!;

    if (candidate.amount.gt(currentWinner.amount)) {
      currentWinner = candidate;
      continue;
    }

    if (candidate.amount.lt(currentWinner.amount)) {
      continue;
    }

    if (candidate.createdAt < currentWinner.createdAt) {
      currentWinner = candidate;
      continue;
    }

    if (candidate.createdAt > currentWinner.createdAt) {
      continue;
    }

    if (candidate.id < currentWinner.id) {
      currentWinner = candidate;
    }
  }

  return currentWinner!;
}

export function toDecimalAmount(
  value: number | string | Decimal,
): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function isPositiveDecimal(value: Decimal): boolean {
  return value.gt(ZERO_DECIMAL);
}
