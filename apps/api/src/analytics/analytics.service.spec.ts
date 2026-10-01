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
});
