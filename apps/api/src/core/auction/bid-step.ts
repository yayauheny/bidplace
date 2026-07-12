export function calculateBidStep(amount: number): number {
  if (amount < 25) {
    return 0.5;
  }

  if (amount < 100) {
    return 1;
  }

  if (amount < 500) {
    return 5;
  }

  if (amount < 1000) {
    return 10;
  }

  return 25;
}
