import { afterEach, describe, expect, it, vi } from 'vitest';

import { syntheticServerEnv } from '../core/config/synthetic-server-env';
import { AnalyticsService } from './analytics.service';

afterEach(() => {
  vi.unstubAllEnvs();
});

const anonymousId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const otherUserId = '33333333-3333-4333-8333-333333333333';
const now = new Date('2026-08-20T12:00:00.000Z');

function createService(prisma: object, overrides: NodeJS.ProcessEnv = {}) {
  return new AnalyticsService(
    prisma as never,
    { now: () => now },
    syntheticServerEnv(overrides),
  );
}

describe('AnalyticsService', () => {
  it('returns accepted without writing when ingest is disabled', async () => {
    vi.stubEnv('ANALYTICS_INGEST_ENABLED', 'true');

    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn(),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'false',
    });

    const result = await service.ingest({
      anonymousId,
      environment: 'local',
      events: [
        {
          name: 'listing_viewed',
          properties: { productPublicId: 'P1' },
        },
      ],
    });

    expect(result).toEqual({ accepted: 1 });
    expect(prisma.acquisitionAttribution.findUnique).not.toHaveBeenCalled();
    expect(prisma.analyticsEvent.createMany).not.toHaveBeenCalled();
  });

  it('creates first-touch attribution and inserts events', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    const result = await service.ingest(
      {
        anonymousId,
        environment: 'local',
        platform: 'web',
        attribution: {
          source: 'instagram',
          medium: 'social',
        },
        events: [
          {
            name: 'listing_viewed',
            properties: { productPublicId: 'P1' },
          },
        ],
      },
      userId,
    );

    expect(result).toEqual({ accepted: 1 });
    expect(prisma.acquisitionAttribution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        anonymousId,
        source: 'instagram',
        medium: 'social',
        capturedAt: now,
        userId: null,
        linkedAt: null,
      }),
    });
    expect(prisma.acquisitionAttribution.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.analyticsEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          eventName: 'listing_viewed',
          anonymousId,
          userId,
          environment: 'local',
          platform: 'web',
        }),
      ],
    });
  });

  it('writes view events without an attribution read', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    const result = await service.ingest({
      anonymousId,
      environment: 'local',
      platform: 'web',
      events: [
        {
          name: 'listing_viewed',
          properties: { productPublicId: 'P1' },
        },
        {
          name: 'seller_viewed',
          properties: { sellerProfileId: userId },
        },
      ],
    });

    expect(result).toEqual({ accepted: 2 });
    expect(prisma.acquisitionAttribution.findUnique).not.toHaveBeenCalled();
    expect(prisma.analyticsEvent.createMany).toHaveBeenCalledTimes(1);
  });

  it('never overwrites first-touch attribution fields', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attr-id',
          anonymousId,
          userId: null,
          source: 'instagram',
        }),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    await service.ingest({
      anonymousId,
      environment: 'local',
      attribution: {
        source: 'google',
        medium: 'cpc',
      },
      events: [
        {
          name: 'seller_viewed',
          properties: {
            sellerProfileId: '44444444-4444-4444-8444-444444444444',
          },
        },
      ],
    });

    expect(prisma.acquisitionAttribution.create).not.toHaveBeenCalled();
    expect(prisma.acquisitionAttribution.update).not.toHaveBeenCalled();
  });

  it('claims acquisition when authenticated and unlinked', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attr-id',
          anonymousId,
          userId: null,
        }),
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    await service.ingest(
      {
        anonymousId,
        environment: 'local',
        claimAcquisition: true,
        events: [{ name: 'registration_started', properties: {} }],
      },
      userId,
    );

    expect(prisma.acquisitionAttribution.update).toHaveBeenCalledWith({
      where: { id: 'attr-id' },
      data: { userId, linkedAt: now },
    });
  });

  it('does not claim when attribution belongs to another user', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attr-id',
          anonymousId,
          userId: otherUserId,
        }),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    await service.ingest(
      {
        anonymousId,
        environment: 'local',
        claimAcquisition: true,
        events: [{ name: 'registration_started', properties: {} }],
      },
      userId,
    );

    expect(prisma.acquisitionAttribution.update).not.toHaveBeenCalled();
  });

  it('skips claim when userId is already linked on another row', async () => {
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attr-id',
          anonymousId,
          userId: null,
        }),
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({ id: 'other-attr' }),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });

    await service.ingest(
      {
        anonymousId,
        environment: 'local',
        claimAcquisition: true,
        events: [{ name: 'registration_started', properties: {} }],
      },
      userId,
    );

    expect(prisma.acquisitionAttribution.update).not.toHaveBeenCalled();
  });

  it('keeps accepted events when attribution create fails', async () => {
    const marker = 'attr-secret-marker';
    const failure = new Error(`create ${marker} ${anonymousId}`);
    failure.stack = [
      failure.toString(),
      `    at prisma.create (/tmp/${marker}.js:3:1)`,
      '    at AnalyticsService.ingest (/app/dist/analytics/analytics.service.js:90:6)',
    ].join('\n');
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockRejectedValue(failure),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });
    const loggerWarn = vi
      .spyOn(
        (
          service as unknown as {
            logger: { warn: (...args: unknown[]) => void };
          }
        ).logger,
        'warn',
      )
      .mockImplementation(() => undefined);

    await expect(
      service.ingest({
        anonymousId,
        environment: 'local',
        attribution: { source: marker },
        events: [{ name: 'listing_viewed', properties: { productPublicId: 'P1' } }],
      }),
    ).resolves.toEqual({ accepted: 1 });

    expect(prisma.analyticsEvent.createMany).toHaveBeenCalledOnce();
    expect(loggerWarn).toHaveBeenCalledOnce();
    expect(loggerWarn.mock.calls[0]).toHaveLength(1);
    const logged = JSON.stringify(loggerWarn.mock.calls);
    expect(logged).toContain('Failed to create acquisition attribution');
    expect(logged).toContain('at=dist/analytics/analytics.service.js:90');
    expect(logged).not.toContain(marker);
    expect(logged).not.toContain(anonymousId);
    loggerWarn.mockRestore();
  });

  it('keeps accepted events when attribution claim fails', async () => {
    const marker = 'claim-secret-marker';
    const failure = new Error(`claim ${marker}`);
    failure.stack = `${failure.toString()}\n    at prisma.update (/tmp/${marker}.js:1:1)`;
    const prisma = {
      acquisitionAttribution: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'attr-id',
          anonymousId,
          userId: null,
        }),
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockRejectedValue(failure),
      },
      analyticsEvent: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = createService(prisma, {
      NODE_ENV: 'development',
      ANALYTICS_INGEST_ENABLED: 'true',
    });
    const loggerWarn = vi
      .spyOn(
        (
          service as unknown as {
            logger: { warn: (...args: unknown[]) => void };
          }
        ).logger,
        'warn',
      )
      .mockImplementation(() => undefined);

    await expect(
      service.ingest(
        {
          anonymousId,
          environment: 'local',
          claimAcquisition: true,
          events: [{ name: 'registration_started', properties: {} }],
        },
        userId,
      ),
    ).resolves.toEqual({ accepted: 1 });

    expect(prisma.acquisitionAttribution.update).toHaveBeenCalledOnce();
    expect(prisma.analyticsEvent.createMany).toHaveBeenCalledOnce();
    expect(loggerWarn).toHaveBeenCalledOnce();
    expect(loggerWarn.mock.calls[0]).toHaveLength(1);
    const logged = JSON.stringify(loggerWarn.mock.calls);
    expect(logged).toContain('Failed to claim acquisition attribution');
    expect(logged).not.toContain(marker);
    expect(logged).not.toContain(anonymousId);
    loggerWarn.mockRestore();
  });
});

it('uses only signed server browser proof and keeps registration successful when attribution storage fails', async () => {
  const {
    analyticsBrowserId,
    signAnalyticsBrowser,
    recordAnalyticsRegistration,
    ANALYTICS_BROWSER_COOKIE,
  } = await import('./browser-attribution');
  const { syntheticServerEnv } =
    await import('../core/config/synthetic-server-env');
  const env = syntheticServerEnv({ ANALYTICS_WEB_ENABLED: 'true' });
  const id = '00000000-0000-4000-8000-000000000001';
  const proof = `${ANALYTICS_BROWSER_COOKIE}=${signAnalyticsBrowser(id, env)}`;
  expect(analyticsBrowserId(proof, env)).toBe(id);
  for (const value of [
    id,
    `${id}.${'é'.repeat(43)}`,
    '%bad',
    `${id}.${'x'.repeat(43)}`,
  ]) {
    expect(
      analyticsBrowserId(`${ANALYTICS_BROWSER_COOKIE}=${value}`, env),
    ).toBeNull();
  }
  expect(
    analyticsBrowserId(
      proof,
      syntheticServerEnv({ ANALYTICS_WEB_ENABLED: 'true', APP_ENV: 'staging' }),
    ),
  ).toBeNull();
  expect(analyticsBrowserId(proof, syntheticServerEnv())).toBeNull();
  const prisma = {
    user: {
      findUniqueOrThrow: vi.fn().mockRejectedValue(new Error('fixture outage')),
    },
    acquisitionAttribution: { updateMany: vi.fn() },
  };
  await expect(
    recordAnalyticsRegistration(prisma as never, env, proof, id),
  ).resolves.toBeUndefined();
  expect(prisma.acquisitionAttribution.updateMany).not.toHaveBeenCalled();
});
