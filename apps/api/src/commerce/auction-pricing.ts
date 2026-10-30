import {
  BID_STEP_TABLES,
  bidStepMinor,
  type Currency,
} from '@bidplace/contracts';

export { bidStepMinor };

export function minimumStepUnitMinor(currency: Currency): number {
  return Math.min(
    ...BID_STEP_TABLES[currency].map((row) => row.stepMinor),
  );
}

export function minimumBidMinor(input: {
  currency: Currency;
  startPriceMinor: number;
  currentPriceMinor: number | null;
  bidCount: number;
}): number {
  if (input.bidCount === 0) return input.startPriceMinor;
  if (input.currentPriceMinor === null) {
    throw new Error('current price is required after the first bid');
  }
  return (
    input.currentPriceMinor +
    bidStepMinor(input.currency, input.currentPriceMinor)
  );
}

export function resolveSoftCloseEndsAt(input: {
  endsAt: Date;
  originalEndsAt: Date;
  now: Date;
  windowSeconds: number;
  extensionSeconds: number;
  maxTotalSeconds: number;
}): Date {
  const remaining = input.endsAt.getTime() - input.now.getTime();
  if (remaining <= 0 || remaining > input.windowSeconds * 1_000) {
    return input.endsAt;
  }
  const extended = input.now.getTime() + input.extensionSeconds * 1_000;
  const cap = input.originalEndsAt.getTime() + input.maxTotalSeconds * 1_000;
  return new Date(Math.max(input.endsAt.getTime(), Math.min(extended, cap)));
}
