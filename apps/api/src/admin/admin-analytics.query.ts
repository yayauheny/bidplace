import { Prisma } from '@bidplace/database';

const users = Prisma.sql`"users"`;
const sellerProfiles = Prisma.sql`"seller_profiles"`;
const products = Prisma.sql`"products"`;
const analyticsEvents = Prisma.sql`"analytics_events"`;
const attributions = Prisma.sql`"acquisition_attributions"`;
const createdAt = Prisma.sql`"created_at"`;
const publishedAt = Prisma.sql`"published_at"`;
const capturedAt = Prisma.sql`"captured_at"`;
const linkedAt = Prisma.sql`"linked_at"`;

export type SqlCount = number | bigint;

export type DayCountRow = {
  date: string;
  count: SqlCount;
};

export type SourceCountRow = {
  source: string;
  visitors: SqlCount;
  signups: SqlCount;
};

export function readSqlCount(value: SqlCount | undefined): number {
  if (typeof value === 'bigint') {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(
        'Analytics aggregate count is outside the safe integer range',
      );
    }
    return Number(value);
  }

  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return value;
  }

  throw new Error(
    'Analytics aggregate count is outside the safe integer range',
  );
}

// timestamp(3) stores the UTC wall time. AT TIME ZONE 'UTC' makes the
// timestamptz parameter compare as that same wall time in any session zone.
function inUtcPeriod(column: Prisma.Sql, from: Date, to: Date): Prisma.Sql {
  return Prisma.sql`(${column} AT TIME ZONE 'UTC') >= ${from}
    AND (${column} AT TIME ZONE 'UTC') <= ${to}`;
}

function utcDayCounts(
  table: Prisma.Sql,
  column: Prisma.Sql,
  from: Date,
  to: Date,
  extra?: Prisma.Sql,
): Prisma.Sql {
  const period = inUtcPeriod(column, from, to);
  const filter = extra ? Prisma.sql`${extra} AND ${period}` : period;

  return Prisma.sql`
    SELECT to_char(${column}, 'YYYY-MM-DD') AS "date",
           COUNT(*) AS "count"
    FROM ${table}
    WHERE ${filter}
    GROUP BY 1
  `;
}

export function countActiveUsersSql(from: Date, to: Date): Prisma.Sql {
  return Prisma.sql`
    SELECT COUNT(DISTINCT "user_id") AS "count"
    FROM ${analyticsEvents}
    WHERE ${inUtcPeriod(createdAt, from, to)}
      AND "user_id" IS NOT NULL
  `;
}

// Visitors are attribution rows captured in the period, with null source
// coalesced to direct. Signups stay inside that cohort: the row also needs a
// user and a linkedAt inside the same period.
export function acquisitionBySourceSql(from: Date, to: Date): Prisma.Sql {
  return Prisma.sql`
    SELECT COALESCE("source", 'direct') AS "source",
           COUNT(*) AS "visitors",
           COUNT(*) FILTER (
             WHERE "user_id" IS NOT NULL
               AND "linked_at" IS NOT NULL
               AND ${inUtcPeriod(linkedAt, from, to)}
           ) AS "signups"
    FROM ${attributions}
    WHERE ${inUtcPeriod(capturedAt, from, to)}
    GROUP BY COALESCE("source", 'direct')
  `;
}

export function userCreationDaySql(from: Date, to: Date): Prisma.Sql {
  return utcDayCounts(users, createdAt, from, to);
}

export function listingViewDaySql(from: Date, to: Date): Prisma.Sql {
  return utcDayCounts(
    analyticsEvents,
    createdAt,
    from,
    to,
    Prisma.sql`"event_name" = ${'listing_viewed'}`,
  );
}

export function sellerCreationDaySql(from: Date, to: Date): Prisma.Sql {
  return utcDayCounts(sellerProfiles, createdAt, from, to);
}

export function publishedWorkDaySql(from: Date, to: Date): Prisma.Sql {
  return utcDayCounts(products, publishedAt, from, to);
}
