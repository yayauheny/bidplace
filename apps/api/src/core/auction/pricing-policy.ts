import { Decimal } from '@bidplace/database';

export type DecimalAmountInput = Decimal | number | string;

const steps = [
  { ceiling: new Decimal(25), value: new Decimal('0.50') },
  { ceiling: new Decimal(100), value: new Decimal(1) },
  { ceiling: new Decimal(500), value: new Decimal(5) },
  { ceiling: new Decimal(1000), value: new Decimal(10) },
] as const;

export function toDecimalAmount(value: DecimalAmountInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function calculateBidStep(currentPrice: DecimalAmountInput): Decimal {
  const price = toDecimalAmount(currentPrice);
  return steps.find(({ ceiling }) => price.lt(ceiling))?.value ?? new Decimal(25);
}

export function resolveMinimumNextBid(currentPrice: DecimalAmountInput): Decimal {
  const price = toDecimalAmount(currentPrice);
  return price.add(calculateBidStep(price));
}

export function resolveMinimumBidAmount(input: {
  currentPrice: DecimalAmountInput;
  startPrice: DecimalAmountInput;
  bidCount: number;
}): Decimal {
  if (input.bidCount === 0) {
    return toDecimalAmount(input.startPrice);
  }

  return resolveMinimumNextBid(input.currentPrice);
}

export function resolveSoftCloseEndsAt(
  endsAt: Date,
  originalEndsAt: Date,
  now: Date,
  windowSeconds: number,
  extensionSeconds: number,
  maxTotalSeconds: number,
): Date {
  const remaining = endsAt.getTime() - now.getTime();

  if (remaining <= 0 || remaining > windowSeconds * 1_000) return endsAt;

  return new Date(
    Math.min(
      endsAt.getTime() + extensionSeconds * 1_000,
      originalEndsAt.getTime() + maxTotalSeconds * 1_000,
    ),
  );
}
