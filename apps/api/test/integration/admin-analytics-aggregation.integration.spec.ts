import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { adminAnalyticsOverviewSchema } from '@bidplace/contracts';
import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AdminAnalyticsService } from '../../src/admin/admin-analytics.service';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { fixturePasswordHash } from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const now = new Date('2026-08-20T15:00:00.000Z');
const profilePhoto = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const expectedSevenDayOverview = JSON.parse(
  readFileSync(join(__dirname, 'admin-analytics-seven-day.json'), 'utf8'),
) as unknown;

const sellerProfiles = Prisma.sql`"seller_profiles"`;
const products = Prisma.sql`"products"`;

let database: IntegrationDatabaseContext;
let prisma: PrismaClient;
let http: HttpTestApp;

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl);
}, 120_000);

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "users", "seller_profiles", "products", "product_revisions", "analytics_events", "acquisition_attributions", "audit_events" CASCADE',
  );
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

function at(value: string): Date {
  return new Date(value);
}

async function setUpdatedAt(
  table: Prisma.Sql,
  id: string,
  updatedAt: Date,
): Promise<void> {
  await prisma.$executeRaw(Prisma.sql`
    UPDATE ${table}
    SET "updated_at" = timezone('UTC', ${updatedAt}::timestamptz)
    WHERE "id" = ${id}::uuid
  `);
}

async function seedParityFixture(): Promise<void> {
  await prisma.user.createMany({
    data: [
      user(
        'a1111111-1111-4111-8111-111111111111',
        'Old User',
        '2026-01-01T00:00:00.000Z',
      ),
      user(
        'a2222222-2222-4222-8222-222222222222',
        'Before User',
        '2026-08-13T14:59:59.999Z',
      ),
      user(
        'a3333333-3333-4333-8333-333333333333',
        'First User',
        '2026-08-13T15:00:00.000Z',
      ),
      user(
        'a4444444-4444-4444-8444-444444444444',
        'Midnight User',
        '2026-08-14T00:00:00.000Z',
      ),
      user(
        'a5555555-5555-4555-8555-555555555555',
        'End User',
        '2026-08-20T15:00:00.000Z',
      ),
      user(
        'a6666666-6666-4666-8666-666666666666',
        'After User',
        '2026-08-20T15:00:00.001Z',
      ),
    ],
  });
  await prisma.sellerProfile.createMany({
    data: [
      seller(
        'b1111111-1111-4111-8111-111111111111',
        'a6666666-6666-4666-8666-666666666666',
        'Recent Author',
        'recent-author',
        'APPROVED',
        '2026-08-19T12:00:00.000Z',
      ),
      seller(
        'b2222222-2222-4222-8222-222222222222',
        'a5555555-5555-4555-8555-555555555555',
        'Mid Author',
        'mid-author',
        'APPROVED',
        '2026-08-15T10:00:00.000Z',
      ),
      seller(
        'b3333333-3333-4333-8333-333333333333',
        'a2222222-2222-4222-8222-222222222222',
        'Stuck Author',
        'stuck-author',
        'PENDING_REVIEW',
        '2026-07-01T00:00:00.000Z',
      ),
      seller(
        'b4444444-4444-4444-8444-444444444444',
        'a1111111-1111-4111-8111-111111111111',
        'Boundary Author',
        'boundary-author',
        'PENDING_REVIEW',
        '2026-08-10T00:00:00.000Z',
      ),
      seller(
        'b5555555-5555-4555-8555-555555555555',
        'a4444444-4444-4444-8444-444444444444',
        'Old Author',
        'old-author',
        'APPROVED',
        '2026-01-02T00:00:00.000Z',
      ),
    ],
  });
  await setUpdatedAt(
    sellerProfiles,
    'b1111111-1111-4111-8111-111111111111',
    at('2026-08-19T12:00:00.000Z'),
  );
  await setUpdatedAt(
    sellerProfiles,
    'b2222222-2222-4222-8222-222222222222',
    at('2026-08-15T10:00:00.000Z'),
  );
  await setUpdatedAt(
    sellerProfiles,
    'b3333333-3333-4333-8333-333333333333',
    at('2026-08-01T00:00:00.000Z'),
  );
  await setUpdatedAt(
    sellerProfiles,
    'b4444444-4444-4444-8444-444444444444',
    at('2026-08-13T15:00:00.000Z'),
  );
  await setUpdatedAt(
    sellerProfiles,
    'b5555555-5555-4555-8555-555555555555',
    at('2026-01-02T00:00:00.000Z'),
  );

  const sellerId = 'b2222222-2222-4222-8222-222222222222';
  await createWork({
    id: 'c1111111-1111-4111-8111-111111111111',
    publicId: 'inperiod0000001',
    title: 'In Period',
    status: 'APPROVED',
    sellerId,
    createdAt: '2026-08-16T07:00:00.000Z',
    publishedAt: '2026-08-16T08:00:00.000Z',
    updatedAt: '2026-08-16T08:00:00.000Z',
    revisionId: 'd1111111-1111-4111-8111-111111111111',
  });
  await createWork({
    id: 'c2222222-2222-4222-8222-222222222222',
    publicId: 'oldwork00000001',
    title: 'Old Work',
    status: 'APPROVED',
    sellerId,
    createdAt: '2026-01-03T00:00:00.000Z',
    publishedAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    revisionId: 'd2222222-2222-4222-8222-222222222222',
  });
  await createWork({
    id: 'c3333333-3333-4333-8333-333333333333',
    publicId: 'boundary0000001',
    title: 'Boundary Work',
    status: 'APPROVED',
    sellerId,
    createdAt: '2026-08-13T15:00:00.000Z',
    publishedAt: '2026-08-13T15:00:00.000Z',
    updatedAt: '2026-08-13T15:00:00.000Z',
    revisionId: 'd3333333-3333-4333-8333-333333333333',
  });
  await createWork({
    id: 'c4444444-4444-4444-8444-444444444444',
    publicId: 'beforework00001',
    title: 'Before Work',
    status: 'APPROVED',
    sellerId,
    createdAt: '2026-08-13T14:59:59.999Z',
    publishedAt: '2026-08-13T14:59:59.999Z',
    updatedAt: '2026-08-13T14:59:59.999Z',
    revisionId: 'd4444444-4444-4444-8444-444444444444',
  });
  await createWork({
    id: 'c5555555-5555-4555-8555-555555555555',
    publicId: 'stuckwork000001',
    title: 'Stuck Work',
    status: 'PENDING_REVIEW',
    sellerId,
    createdAt: '2026-07-01T00:00:00.000Z',
    publishedAt: null,
    updatedAt: '2026-08-01T00:00:00.000Z',
    revisionId: null,
  });
  await createWork({
    id: 'c6666666-6666-4666-8666-666666666666',
    publicId: 'freshreview0001',
    title: 'Fresh Review',
    status: 'PENDING_REVIEW',
    sellerId,
    createdAt: '2026-08-12T00:00:00.000Z',
    publishedAt: null,
    updatedAt: '2026-08-13T15:00:00.000Z',
    revisionId: null,
  });
  await createWork({
    id: 'c7777777-7777-4777-8777-777777777777',
    publicId: 'draftperiod0001',
    title: 'Draft Period',
    status: 'DRAFT',
    sellerId,
    createdAt: '2026-08-18T00:00:00.000Z',
    publishedAt: null,
    updatedAt: '2026-08-18T00:00:00.000Z',
    revisionId: null,
  });

  await prisma.analyticsEvent.createMany({
    data: [
      analyticsEvent(
        'f1111111-1111-4111-8111-111111111111',
        'listing_viewed',
        '2026-08-13T15:00:00.000Z',
        'a3333333-3333-4333-8333-333333333333',
      ),
      analyticsEvent(
        'f2222222-2222-4222-8222-222222222222',
        'listing_viewed',
        '2026-08-13T23:59:59.999Z',
        'a3333333-3333-4333-8333-333333333333',
      ),
      analyticsEvent(
        'f3333333-3333-4333-8333-333333333333',
        'listing_viewed',
        '2026-08-15T12:00:00.000Z',
        'a3333333-3333-4333-8333-333333333333',
      ),
      analyticsEvent(
        'f4444444-4444-4444-8444-444444444444',
        'listing_viewed',
        '2026-08-20T15:00:00.000Z',
        'a3333333-3333-4333-8333-333333333333',
      ),
      analyticsEvent(
        'f5555555-5555-4555-8555-555555555555',
        'seller_viewed',
        '2026-08-14T00:00:00.000Z',
        'a4444444-4444-4444-8444-444444444444',
      ),
      analyticsEvent(
        'f6666666-6666-4666-8666-666666666666',
        'listing_viewed',
        '2026-08-16T00:00:00.000Z',
        null,
      ),
      analyticsEvent(
        'f7777777-7777-4777-8777-777777777777',
        'listing_viewed',
        '2026-08-16T01:00:00.000Z',
        null,
      ),
      analyticsEvent(
        'f8888888-8888-4888-8888-888888888888',
        'listing_viewed',
        '2026-08-13T14:59:59.999Z',
        'a1111111-1111-4111-8111-111111111111',
      ),
      analyticsEvent(
        'f9999999-9999-4999-8999-999999999999',
        'listing_viewed',
        '2026-08-20T15:00:00.001Z',
        'a6666666-6666-4666-8666-666666666666',
      ),
    ],
  });
  await prisma.acquisitionAttribution.createMany({
    data: [
      attribution(
        'e1111111-1111-4111-8111-111111111111',
        'instagram',
        'a3333333-3333-4333-8333-333333333333',
        '2026-08-15T00:00:00.000Z',
        '2026-08-15T01:00:00.000Z',
      ),
      attribution(
        'e2222222-2222-4222-8222-222222222222',
        'instagram',
        null,
        '2026-08-17T00:00:00.000Z',
        null,
      ),
      attribution(
        'e3333333-3333-4333-8333-333333333333',
        'instagram',
        null,
        '2026-08-17T03:00:00.000Z',
        null,
      ),
      attribution(
        'e4444444-4444-4444-8444-444444444444',
        null,
        null,
        '2026-08-16T00:00:00.000Z',
        null,
      ),
      attribution(
        'e5555555-5555-4555-8555-555555555555',
        'direct',
        'a4444444-4444-4444-8444-444444444444',
        '2026-08-14T00:00:00.000Z',
        '2026-08-14T00:00:00.000Z',
      ),
      attribution(
        'e6666666-6666-4666-8666-666666666666',
        'newsletter',
        'a5555555-5555-4555-8555-555555555555',
        '2026-08-13T14:00:00.000Z',
        '2026-08-18T00:00:00.000Z',
      ),
      attribution(
        'e7777777-7777-4777-8777-777777777777',
        'newsletter',
        'a1111111-1111-4111-8111-111111111111',
        '2026-08-18T00:00:00.000Z',
        '2026-08-01T00:00:00.000Z',
      ),
    ],
  });
  await prisma.auditEvent.createMany({
    data: [
      {
        targetType: 'PRODUCT',
        targetId: 'c1111111-1111-4111-8111-111111111111',
        newStatus: 'APPROVED',
        createdAt: at('2026-08-16T09:00:00.000Z'),
      },
      {
        targetType: 'PRODUCT',
        targetId: 'c2222222-2222-4222-8222-222222222222',
        newStatus: 'APPROVED',
        createdAt: at('2026-01-03T00:00:00.000Z'),
      },
      {
        targetType: 'SELLER_PROFILE',
        targetId: 'b2222222-2222-4222-8222-222222222222',
        newStatus: 'APPROVED',
        createdAt: at('2026-08-16T09:00:00.000Z'),
      },
    ],
  });
}

function user(id: string, displayName: string, createdAt: string) {
  return {
    id,
    email: `${id}@analytics.test`,
    passwordHash: 'test-hash',
    displayName,
    createdAt: at(createdAt),
  };
}

function seller(
  id: string,
  userId: string,
  fullName: string,
  slug: string,
  status: 'APPROVED' | 'PENDING_REVIEW',
  createdAt: string,
) {
  return {
    id,
    userId,
    slug,
    sellerType: 'creator',
    fullName,
    country: 'BY',
    status,
    createdAt: at(createdAt),
    profilePhotoMimeType: 'image/png',
    profilePhotoByteLength: profilePhoto.byteLength,
    profilePhotoChecksum: '0'.repeat(64),
    profilePhotoData: profilePhoto,
  };
}

function analyticsEvent(
  anonymousId: string,
  eventName: string,
  createdAt: string,
  userId: string | null,
) {
  return {
    anonymousId,
    eventName,
    userId,
    environment: 'test',
    createdAt: at(createdAt),
  };
}

function attribution(
  anonymousId: string,
  source: string | null,
  userId: string | null,
  capturedAt: string,
  linkedAt: string | null,
) {
  return {
    anonymousId,
    source,
    userId,
    capturedAt: at(capturedAt),
    linkedAt: linkedAt ? at(linkedAt) : null,
  };
}

async function createWork(input: {
  id: string;
  publicId: string;
  title: string;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'DRAFT';
  sellerId: string;
  createdAt: string;
  publishedAt: string | null;
  updatedAt: string;
  revisionId: string | null;
}): Promise<void> {
  await prisma.product.create({
    data: {
      id: input.id,
      publicId: input.publicId,
      sellerProfileId: input.sellerId,
      title: input.title,
      status: input.status,
      createdAt: at(input.createdAt),
      publishedAt: input.publishedAt ? at(input.publishedAt) : null,
    },
  });
  if (input.revisionId) {
    await prisma.productRevision.create({
      data: {
        id: input.revisionId,
        productId: input.id,
        version: 1,
        status: 'APPROVED',
        title: input.title,
      },
    });
    await prisma.product.update({
      where: { id: input.id },
      data: { publishedRevisionId: input.revisionId },
    });
  }
  await setUpdatedAt(products, input.id, at(input.updatedAt));
}

type QuerySize = { kind: string; rows: number };

function observeAggregates(client: PrismaClient): {
  prisma: PrismaClient;
  sizes: QuerySize[];
} {
  const sizes: QuerySize[] = [];
  const prismaProxy = new Proxy(client, {
    get(target, property, receiver) {
      if (property === '$queryRaw') {
        return (query: { strings: string[] }) => {
          const pending = target.$queryRaw(query as never);
          return Promise.resolve(pending).then((rows: unknown) => {
            sizes.push({
              kind: queryKind(query.strings.join(' ')),
              rows: Array.isArray(rows) ? rows.length : -1,
            });
            return rows;
          });
        };
      }
      const value: unknown = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { prisma: prismaProxy as PrismaClient, sizes };
}

function queryKind(sql: string): string {
  if (sql.includes('COUNT(DISTINCT')) {
    return 'activeUsers';
  }
  if (sql.includes('acquisition_attributions')) {
    return 'acquisition';
  }
  if (sql.includes('event_name')) {
    return 'listingDays';
  }
  if (sql.includes('seller_profiles')) {
    return 'sellerDays';
  }
  if (sql.includes('"products"')) {
    return 'workDays';
  }
  if (sql.includes('"users"')) {
    return 'userDays';
  }
  return 'other';
}

async function overviewInTimeZone(timeZone: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw(
      Prisma.sql`SELECT set_config('TimeZone', ${timeZone}, true)`,
    );
    return new AdminAnalyticsService(tx as never).buildOverview(
      { period: '7d' },
      now,
    );
  });
}

describe('admin analytics database aggregation', () => {
  it('matches the pre-aggregation overview JSON', async () => {
    await seedParityFixture();
    const { prisma: observed, sizes } = observeAggregates(prisma);
    const overview = await new AdminAnalyticsService(
      observed as never,
    ).buildOverview({ period: '7d' }, now);

    expect(overview).toEqual(expectedSevenDayOverview);
    expect(sizes).toHaveLength(6);
    expect(
      Object.fromEntries(sizes.map((size) => [size.kind, size.rows])),
    ).toEqual({
      activeUsers: 1,
      acquisition: 3,
      userDays: 3,
      listingDays: 4,
      sellerDays: 2,
      workDays: 2,
    });
    expect(await prisma.analyticsEvent.count()).toBe(9);
    expect(await prisma.acquisitionAttribution.count()).toBe(7);
  });

  it('keeps the same overview when the session zone is not UTC', async () => {
    await seedParityFixture();

    expect(await overviewInTimeZone('Europe/Minsk')).toEqual(
      expectedSevenDayOverview,
    );
    expect(await overviewInTimeZone('America/Los_Angeles')).toEqual(
      expectedSevenDayOverview,
    );
  });

  it('keeps period bounds, partial days, and zero buckets', async () => {
    await seedParityFixture();
    const service = new AdminAnalyticsService(prisma as never);

    const today = await service.buildOverview({ period: 'today' }, now);
    expect(today.from).toBe('2026-08-20T00:00:00.000Z');
    expect(today.growth).toEqual([
      {
        date: '2026-08-20',
        newUsers: 1,
        listingViews: 1,
        newSellers: 0,
        newWorks: 0,
      },
    ]);
    expect(today.overview.newUsers.value).toBe(1);
    expect(today.overview.activeUsers.value).toBe(1);
    expect(today.acquisition.bySource).toEqual([]);
    expect(today.acquisition.visitorToSignupRate).toBeNull();

    const thirty = await service.buildOverview({ period: '30d' }, now);
    expect(thirty.from).toBe('2026-07-21T15:00:00.000Z');
    expect(thirty.growth).toHaveLength(31);
    expect(thirty.growth[0]?.newUsers).toBe(0);
    expect(thirty.overview.newUsers.value).toBe(4);
    expect(thirty.sellerFunnel.sellerProfiles.value).toBe(3);

    const ninety = await service.buildOverview({ period: '90d' }, now);
    expect(ninety.from).toBe('2026-05-22T15:00:00.000Z');
    expect(ninety.growth).toHaveLength(91);
    expect(ninety.overview.newUsers.value).toBe(4);
    expect(ninety.sellerFunnel.sellerProfiles.value).toBe(4);

    const partial = await service.buildOverview(
      {
        period: 'custom',
        from: '2026-08-13T23:00:00.000Z',
        to: '2026-08-14T01:00:00.000Z',
      },
      now,
    );
    expect(partial.growth).toEqual([
      {
        date: '2026-08-13',
        newUsers: 0,
        listingViews: 1,
        newSellers: 0,
        newWorks: 0,
      },
      {
        date: '2026-08-14',
        newUsers: 1,
        listingViews: 0,
        newSellers: 0,
        newWorks: 0,
      },
    ]);
    expect(partial.overview.activeUsers.value).toBe(2);
  });

  it('returns an empty overview with zero buckets and a null rate', async () => {
    const overview = await new AdminAnalyticsService(
      prisma as never,
    ).buildOverview({ period: '7d' }, now);

    expect(overview.overview.users.value).toBe(0);
    expect(overview.overview.activeUsers.value).toBe(0);
    expect(overview.acquisition.bySource).toEqual([]);
    expect(overview.acquisition.visitorToSignupRate).toBeNull();
    expect(overview.growth).toHaveLength(8);
    expect(overview.growth.every((row) => row.listingViews === 0)).toBe(true);
    expect(overview.recent.users).toEqual([]);
    expect(overview.attention).toEqual({ stuckProducts: 0, stuckSellers: 0 });
  });

  it('counts attribution rows, merges null into direct, and sorts ties', async () => {
    const capturedAt = at('2026-08-18T00:00:00.000Z');
    await prisma.acquisitionAttribution.createMany({
      data: [
        {
          anonymousId: 'e1111111-1111-4111-8111-111111111111',
          source: 'zoo',
          capturedAt,
        },
        {
          anonymousId: 'e2222222-2222-4222-8222-222222222222',
          source: 'zoo',
          capturedAt,
        },
        {
          anonymousId: 'e3333333-3333-4333-8333-333333333333',
          source: 'instagram',
          userId: 'a3333333-3333-4333-8333-333333333333',
          capturedAt,
          linkedAt: at('2026-08-01T00:00:00.000Z'),
        },
        {
          anonymousId: 'e4444444-4444-4444-8444-444444444444',
          source: 'direct',
          userId: 'a4444444-4444-4444-8444-444444444444',
          capturedAt,
          linkedAt: capturedAt,
        },
        {
          anonymousId: 'e5555555-5555-4555-8555-555555555555',
          source: null,
          capturedAt,
        },
        {
          anonymousId: 'e6666666-6666-4666-8666-666666666666',
          source: '',
          capturedAt,
        },
        {
          anonymousId: 'e7777777-7777-4777-8777-777777777777',
          source: 'newsletter',
          userId: 'a5555555-5555-4555-8555-555555555555',
          capturedAt: at('2026-08-01T00:00:00.000Z'),
          linkedAt: capturedAt,
        },
      ],
    });

    const overview = await new AdminAnalyticsService(
      prisma as never,
    ).buildOverview({ period: '7d' }, now);

    expect(overview.acquisition.bySource).toEqual([
      { source: 'direct', visitors: 2, signups: 1 },
      { source: 'zoo', visitors: 2, signups: 0 },
      { source: '', visitors: 1, signups: 0 },
      { source: 'instagram', visitors: 1, signups: 0 },
    ]);
    expect(overview.acquisition.visitorToSignupRate).toBe(1 / 6);
  });

  it('returns one aggregate row per distinct user, source, and UTC day', async () => {
    const userIds = [
      'a1111111-1111-4111-8111-111111111111',
      'a2222222-2222-4222-8222-222222222222',
      'a3333333-3333-4333-8333-333333333333',
    ];
    await prisma.user.createMany({
      data: userIds.map((id, index) =>
        user(id, `Volume ${index}`, '2026-08-16T12:00:00.000Z'),
      ),
    });
    const days = [
      '2026-08-14T12:00:00.000Z',
      '2026-08-15T12:00:00.000Z',
      '2026-08-16T12:00:00.000Z',
      '2026-08-17T12:00:00.000Z',
      '2026-08-18T12:00:00.000Z',
    ];
    await prisma.analyticsEvent.createMany({
      data: Array.from({ length: 48 }, (_, index) =>
        analyticsEvent(
          randomUUID(),
          'listing_viewed',
          days[index % days.length]!,
          index % 8 === 0 ? null : userIds[index % userIds.length]!,
        ),
      ),
    });
    await prisma.acquisitionAttribution.createMany({
      data: Array.from({ length: 20 }, (_, index) =>
        attribution(
          randomUUID(),
          ['alpha', 'beta', 'gamma', 'direct'][index % 4]!,
          null,
          '2026-08-16T12:00:00.000Z',
          null,
        ),
      ),
    });
    const { prisma: observed, sizes } = observeAggregates(prisma);

    const overview = await new AdminAnalyticsService(
      observed as never,
    ).buildOverview({ period: '7d' }, now);

    expect(await prisma.analyticsEvent.count()).toBe(48);
    expect(await prisma.acquisitionAttribution.count()).toBe(20);
    expect(sizes).toHaveLength(6);
    expect(
      Object.fromEntries(sizes.map((size) => [size.kind, size.rows])),
    ).toEqual({
      activeUsers: 1,
      acquisition: 4,
      userDays: 1,
      listingDays: 5,
      sellerDays: 0,
      workDays: 0,
    });
    expect(overview.overview.activeUsers.value).toBe(3);
    expect(overview.acquisition.bySource).toHaveLength(4);
    expect(overview.growth).toHaveLength(8);
    expect(
      overview.growth.reduce((sum, row) => sum + row.listingViews, 0),
    ).toBe(48);
  });

  it('allows only an admin to read the overview', async () => {
    const admin = await prisma.user.create({
      data: {
        email: 'admin.analytics@analytics.test',
        passwordHash: fixturePasswordHash,
        displayName: 'Analytics admin',
        role: 'admin',
      },
    });
    const member = await prisma.user.create({
      data: {
        email: 'member.analytics@analytics.test',
        passwordHash: fixturePasswordHash,
        displayName: 'Analytics member',
      },
    });
    const anonymous = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const memberClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
    );
    const adminClient = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
    );

    expect((await anonymous.get('/admin/analytics/overview')).status).toBe(401);
    expect(
      (
        await memberClient.post('/auth/login', {
          email: member.email,
          password: 'password123',
        })
      ).status,
    ).toBe(201);
    expect((await memberClient.get('/admin/analytics/overview')).status).toBe(
      403,
    );
    expect(
      (
        await adminClient.post('/auth/login', {
          email: admin.email,
          password: 'password123',
        })
      ).status,
    ).toBe(201);
    const response = await adminClient.get('/admin/analytics/overview');
    expect(response.status).toBe(200);
    expect(
      adminAnalyticsOverviewSchema.safeParse(await response.json()).success,
    ).toBe(true);
  });
});
