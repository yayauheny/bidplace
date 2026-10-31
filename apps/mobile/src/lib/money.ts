const moneyFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyLabel = {
  BYN: 'BYN',
  RUB: '₽',
} as const;

export function formatMoney(minor: number, currency: 'BYN' | 'RUB'): string {
  const formatted = moneyFormat.format(minor / 100).replace(/,00$/, '');
  return `${formatted} ${currencyLabel[currency]}`;
}

const moneyInput = /^(?:\d+)(?:[.,]\d{1,2})?$/;
const minorPerMajor = { BYN: 100, RUB: 100 } as const;

export function parseMoneyInput(
  text: string,
  currency: 'BYN' | 'RUB',
): number | null {
  const compact = text.replace(/[\s\u00a0\u202f]/g, '');
  if (!moneyInput.test(compact)) return null;
  const major = Number(compact.replace(',', '.'));
  if (!Number.isFinite(major)) return null;
  return Math.round(major * minorPerMajor[currency]);
}
