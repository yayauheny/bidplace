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

const moneyInput = /^(\d+)(?:[.,](\d{1,2}))?$/;
const minorPerMajor = { BYN: 100, RUB: 100 } as const;

export function parseMoneyInput(
  text: string,
  currency: 'BYN' | 'RUB',
): number | null {
  const compact = text.replace(/[\s\u00a0\u202f]/g, '');
  const match = moneyInput.exec(compact);
  if (!match) return null;
  const places = String(minorPerMajor[currency]).length - 1;
  const digits = `${match[1]}${(match[2] ?? '').padEnd(places, '0')}`.replace(
    /^0+(?=\d)/,
    '',
  );
  const minor = BigInt(digits);
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  const value = Number(minor);
  if (!Number.isSafeInteger(value)) return null;
  return value;
}
