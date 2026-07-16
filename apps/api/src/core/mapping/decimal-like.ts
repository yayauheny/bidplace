export type DecimalLike = number | { toNumber(): number };

export function toNumber(value: DecimalLike): number {
  return typeof value === 'number' ? value : value.toNumber();
}
