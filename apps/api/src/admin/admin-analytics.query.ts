import { portfolioProductContentSql } from '../products/public-visibility';
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

// timestamp(3) without time zone stores the UTC wall time. Convert the
// timestamptz bounds to that timestamp so the comparison ignores the session
// TimeZone and the bare column can use a range index condition.
function inUtcPeriod(column: Prisma.Sql, from: Date, to: Date): Prisma.Sql {
  return Prisma.sql`${column} >= (${from}::timestamptz AT TIME ZONE 'UTC')
    AND ${column} <= (${to}::timestamptz AT TIME ZONE 'UTC')`;
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
    WHERE "collection_version" = 1 AND ${inUtcPeriod(capturedAt, from, to)}
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
  return utcDayCounts(
    products,
    publishedAt,
    from,
    to,
    Prisma.sql`"deleted_at" IS NULL`,
  );
}

export function inUtcWindow(
  column: Prisma.Sql,
  from: Date,
  to: Date,
): Prisma.Sql {
  return Prisma.sql`${column} >= (${from}::timestamptz AT TIME ZONE 'UTC')
    AND ${column} < (${to}::timestamptz AT TIME ZONE 'UTC')`;
}
export function foundationCountsSql(
  from: Date,
  to: Date,
  environment: string,
  now: Date,
): Prisma.Sql {
  const stuck = new Date(now.getTime() - 7 * 86_400_000);
  return Prisma.sql`
    WITH views AS (
      SELECT anonymous_id, session_id FROM analytics_events
      WHERE collection_version = 2 AND environment = ${environment}
        AND ${inUtcWindow(Prisma.sql`created_at`, from, to)}
    ), authors AS (
      SELECT p.*, u.status AS user_status, r.status::text AS review_status, r.submitted_at
      FROM seller_profiles p JOIN users u ON u.id = p.user_id
      LEFT JOIN seller_profile_revisions r ON r.id = p.editing_revision_id
    ), works AS (
      SELECT p.*, a.status AS author_status, a.user_status, r.status::text AS review_status, r.submitted_at
      FROM products p JOIN authors a ON a.id = p.seller_profile_id
      LEFT JOIN product_revisions r ON r.id = p.editing_revision_id
      WHERE p.deleted_at IS NULL
    ), pending_authors AS (
      SELECT * FROM authors WHERE review_status = 'PENDING_REVIEW' OR (editing_revision_id IS NULL AND status::text = 'PENDING_REVIEW')
    ), pending_works AS (
      SELECT * FROM works WHERE review_status = 'PENDING_REVIEW' OR (editing_revision_id IS NULL AND status::text = 'PENDING_REVIEW')
    ) SELECT
      (SELECT COUNT(*) FROM views) AS views,
      (SELECT COUNT(DISTINCT anonymous_id) FROM views) AS visitors,
      (SELECT COUNT(DISTINCT session_id) FROM views) AS sessions,
      (SELECT COUNT(*) FROM authors WHERE ${inUtcWindow(Prisma.sql`first_published_at`, from, to)}) AS "firstAuthors",
      (SELECT COUNT(*) FROM works WHERE ${inUtcWindow(Prisma.sql`published_at`, from, to)}) AS "firstWorks",
      (SELECT COUNT(*) FROM users WHERE ${inUtcWindow(Prisma.sql`created_at`, from, to)}) AS registrations,
      (SELECT COUNT(*) FROM authors WHERE status::text = 'APPROVED' AND user_status = 'active') AS "currentAuthors",
      (SELECT COUNT(*) FROM works p WHERE p.status::text = 'APPROVED'
        AND p.author_status::text = 'APPROVED' AND p.user_status = 'active' AND ${portfolioProductContentSql}) AS "currentWorks",
      (SELECT COUNT(*) FROM pending_authors) AS "pendingAuthors",
      (SELECT COUNT(*) FROM pending_works) AS "pendingWorks",
      (SELECT COUNT(*) FROM pending_authors WHERE submitted_at < (${stuck}::timestamptz AT TIME ZONE 'UTC')) AS "stuckAuthors",
      (SELECT COUNT(*) FROM pending_works WHERE submitted_at < (${stuck}::timestamptz AT TIME ZONE 'UTC')) AS "stuckWorks",
      (SELECT COUNT(*) FROM pending_authors WHERE submitted_at IS NULL) AS "unknownAuthorSubmissionTime",
      (SELECT COUNT(*) FROM pending_works WHERE submitted_at IS NULL) AS "unknownWorkSubmissionTime",
      (SELECT COUNT(*) FROM authors WHERE status::text = 'APPROVED' AND user_status = 'active' AND first_published_at IS NULL) AS "unknownAuthorFirstPublication"
  `;
}
export function foundationAcquisitionSql(
  from: Date,
  to: Date,
  environment: string,
  now: Date,
): Prisma.Sql {
  return Prisma.sql`
    SELECT a.source, COUNT(*) AS visitors,
      COUNT(*) FILTER (WHERE u.created_at >= a.captured_at
        AND u.created_at <= a.captured_at + INTERVAL '30 days'
        AND u.created_at <= (${now}::timestamptz AT TIME ZONE 'UTC')) AS registrations
    FROM acquisition_attributions a LEFT JOIN users u ON u.id = a.registered_user_id
    WHERE a.collection_version = 2 AND a.environment = ${environment}
      AND ${inUtcWindow(Prisma.sql`a.captured_at`, from, to)}
      AND EXISTS (SELECT 1 FROM analytics_events e WHERE e.anonymous_id = a.anonymous_id
        AND e.collection_version = 2 AND e.environment = ${environment})
    GROUP BY a.source ORDER BY visitors DESC, a.source ASC
  `;
}

export function foundationGrowthSql(
  from: Date,
  to: Date,
  environment: string,
): Prisma.Sql {
  return Prisma.sql`
    WITH days AS (
      SELECT generate_series(date_trunc('day', (${from}::timestamptz AT TIME ZONE 'UTC')),
        (${to}::timestamptz AT TIME ZONE 'UTC') - INTERVAL '1 millisecond', INTERVAL '1 day')::date AS day
    ), counts AS (
      SELECT created_at::date AS day, COUNT(*) AS views, COUNT(DISTINCT anonymous_id) AS visitors, COUNT(DISTINCT session_id) AS sessions,
        0::bigint AS registrations, 0::bigint AS authors, 0::bigint AS works
      FROM analytics_events WHERE collection_version = 2 AND environment = ${environment}
        AND ${inUtcWindow(Prisma.sql`created_at`, from, to)} GROUP BY 1
      UNION ALL
      SELECT created_at::date, 0, 0, 0, COUNT(*), 0, 0 FROM users
        WHERE ${inUtcWindow(Prisma.sql`created_at`, from, to)} GROUP BY 1
      UNION ALL
      SELECT first_published_at::date, 0, 0, 0, 0, COUNT(*), 0 FROM seller_profiles
        WHERE ${inUtcWindow(Prisma.sql`first_published_at`, from, to)} GROUP BY 1
      UNION ALL
      SELECT published_at::date, 0, 0, 0, 0, 0, COUNT(*) FROM products
        WHERE deleted_at IS NULL AND ${inUtcWindow(Prisma.sql`published_at`, from, to)} GROUP BY 1
    ) SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
      COALESCE(SUM(c.views), 0)::bigint AS views, COALESCE(SUM(c.visitors), 0)::bigint AS visitors,
      COALESCE(SUM(c.sessions), 0)::bigint AS sessions,
      COALESCE(SUM(c.registrations), 0)::bigint AS registrations,
      COALESCE(SUM(c.authors), 0)::bigint AS "firstAuthors", COALESCE(SUM(c.works), 0)::bigint AS "firstWorks"
    FROM days d LEFT JOIN counts c ON c.day = d.day GROUP BY d.day ORDER BY d.day
  `;
}
