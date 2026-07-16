import { Decimal } from '@bidplace/database';

import { type Bid } from '@bidplace/contracts';
import { type DecimalLike } from '../mapping/decimal-like';

export type AuctionBidLike = {
  id: string;
  amount: DecimalLike;
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

export function calculateBidStep(amount: DecimalLike): Decimal {
  const decimalAmount = toDecimalAmount(amount);

  for (const rule of BID_STEP_RULES) {
    if (decimalAmount.lt(rule.upperBound)) {
      return rule.step;
    }
  }

  return new Decimal(25);
}

export function resolveMinimumNextBid(currentPrice: DecimalLike): Decimal {
  const decimalCurrentPrice = toDecimalAmount(currentPrice);

  return decimalCurrentPrice.add(calculateBidStep(decimalCurrentPrice));
}

export function resolveCurrentPrice(
  startPrice: DecimalLike,
  highestEligibleBid: Decimal | null,
): Decimal {
  return highestEligibleBid ?? toDecimalAmount(startPrice);
}

export function reserveReached(
  currentPrice: DecimalLike,
  reservePrice: DecimalLike,
): boolean {
  return toDecimalAmount(currentPrice).gte(toDecimalAmount(reservePrice));
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
    const candidateAmount = toDecimalAmount(candidate.amount);
    const currentWinnerAmount = toDecimalAmount(currentWinner.amount);

    if (candidateAmount.gt(currentWinnerAmount)) {
      currentWinner = candidate;
      continue;
    }

    if (candidateAmount.lt(currentWinnerAmount)) {
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
  value: number | string | Decimal | { toNumber(): number },
): Decimal {
  if (value instanceof Decimal) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return new Decimal(value.toNumber());
  }

  return new Decimal(value);
}

export function isPositiveDecimal(value: DecimalLike): boolean {
  return toDecimalAmount(value).gt(ZERO_DECIMAL);
}
