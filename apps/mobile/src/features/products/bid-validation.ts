import { formatDisplayPrice } from '../../lib/formatters';

const moneyScale = 100;

function toCents(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const cents = Math.round(value * moneyScale);
  return Math.abs(cents / moneyScale - value) < Number.EPSILON ? cents : null;
}

export function bidIncrementForAmount(amount: number): number {
  if (amount < 25) return 0.5;
  if (amount < 100) return 1;
  if (amount < 500) return 5;
  if (amount < 1_000) return 10;
  return 25;
}

export function validateBidAmount(
  amountInput: string,
  minimumNextBid: number | null,
): string | null {
  const amount = Number(amountInput.replace(',', '.'));
  const amountCents = toCents(amount);
  if (amountCents === null) return 'Введите сумму ставки в BYN.';
  if (minimumNextBid === null)
    return 'Минимальная ставка сейчас недоступна. Обновите предмет.';

  const minimumCents = toCents(minimumNextBid);
  if (minimumCents === null)
    return 'Минимальная ставка сейчас недоступна. Обновите предмет.';
  if (amountCents < minimumCents)
    return `Минимальная ставка — ${formatDisplayPrice(minimumNextBid)}.`;

  const incrementCents = bidIncrementForAmount(minimumNextBid) * moneyScale;
  if ((amountCents - minimumCents) % incrementCents !== 0) {
    return `Ставка должна увеличиваться на ${formatDisplayPrice(bidIncrementForAmount(minimumNextBid))}.`;
  }

  return null;
}
