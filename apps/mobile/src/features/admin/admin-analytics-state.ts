import { analyticsFoundationQuerySchema } from '@bidplace/contracts';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | '90d' | 'custom';
const DAY = 86_400_000;

export function analyticsRange(
  period: AnalyticsPeriod,
  now: Date,
  start: string,
  end: string,
) {
  let from: Date;
  let to: Date;
  if (period === 'custom') {
    const dates = [start, end].map(
      (value) => new Date(`${value}T00:00:00.000Z`),
    );
    if (
      [start, end].some(
        (value, index) =>
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          !Number.isFinite(dates[index]!.getTime()) ||
          dates[index]!.toISOString().slice(0, 10) !== value,
      )
    )
      return null;
    from = dates[0]!;
    to = new Date(dates[1]!.getTime() + DAY);
  } else {
    to = now;
    const dayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    from = new Date(
      dayStart - (period === 'today' ? 0 : Number.parseInt(period) - 1) * DAY,
    );
  }
  const parsed = analyticsFoundationQuerySchema.safeParse({
    from: from.toISOString(),
    to: to.toISOString(),
    includeActivity: true,
  });
  return parsed.success ? parsed.data : null;
}

export function analyticsRate(value: number | null) {
  return value === null
    ? '—'
    : `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value * 100)}%`;
}
