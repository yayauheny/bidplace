import { portfolioCatalogProductWhere } from '../products/public-visibility';
import { randomUUID } from 'node:crypto';
import {
  type WebAnalyticsRequest,
  type AnalyticsIngestRequest,
  type AnalyticsIngestResponse,
} from '@bidplace/contracts';
import { type Prisma } from '@bidplace/database';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { SERVER_ENV, type ServerEnv } from '../core/config';
import { PrismaService } from '../core/database';
import { safeFailureLocation } from '../core/request-context/safe-request-log';
import { Clock } from '../core/time';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  async ingestWeb(input: WebAnalyticsRequest, browserId: string | null) {
    if (!this.env.ANALYTICS_WEB_ENABLED)
      return { accepted: 0, sessionId: null, browserId: null };
    const workIds = input.events.flatMap((event) =>
      event.page.page === 'work' ? [event.page.publicId] : [],
    );
    const authorSlugs = input.events.flatMap((event) =>
      event.page.page === 'author' ? [event.page.slug] : [],
    );
    const [works, authors] = await Promise.all([
      workIds.length
        ? this.prisma.product.findMany({
            where: {
              ...portfolioCatalogProductWhere,
              publicId: { in: workIds },
            },
            select: { publicId: true },
          })
        : [],
      authorSlugs.length
        ? this.prisma.sellerProfile.findMany({
            where: {
              status: 'APPROVED',
              user: { status: 'active' },
              OR: [
                { user: { slug: { in: authorSlugs } } },
                { user: { slug: null }, slug: { in: authorSlugs } },
              ],
            },
            select: { slug: true, user: { select: { slug: true } } },
          })
        : [],
    ]);
    const publicWorks = new Set(works.map((work) => work.publicId));
    const publicAuthors = new Set(
      authors.map((author) => author.user.slug ?? author.slug),
    );
    const publicEvents = input.events.filter(({ page }) =>
      page.page === 'work'
        ? publicWorks.has(page.publicId)
        : page.page === 'author'
          ? publicAuthors.has(page.slug)
          : true,
    );
    if (!publicEvents.length)
      return { accepted: 0, sessionId: null, browserId: null };
    const id = browserId ?? randomUUID();
    const now = this.clock.now();
    const attribution = input.attribution;
    const host = attribution?.referrerHost?.toLowerCase();
    const ownHost = this.env.CORS_ORIGIN
      ? new URL(this.env.CORS_ORIGIN).hostname
      : null;
    const hasUtm =
      attribution &&
      [
        attribution.source,
        attribution.medium,
        attribution.campaign,
        attribution.content,
      ].some(Boolean);
    const source = hasUtm
      ? (attribution.source ?? 'utm')
      : host && host !== ownHost
        ? host
        : 'direct';
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.acquisitionAttribution.upsert({
        where: { anonymousId: id },
        update: {},
        create: {
          anonymousId: id,
          collectionVersion: 2,
          environment: this.env.APP_ENV,
          source,
          medium: attribution?.medium ?? null,
          campaign: attribution?.campaign ?? null,
          content: attribution?.content ?? null,
          referrer: host && host !== ownHost ? host : null,
          capturedAt: now,
        },
      });
      await tx.$queryRaw`SELECT id FROM acquisition_attributions WHERE anonymous_id = ${id}::uuid FOR UPDATE`;
      const visit = await tx.acquisitionAttribution.findUniqueOrThrow({
        where: { anonymousId: id },
      });
      if (
        visit.collectionVersion !== 2 ||
        visit.environment !== this.env.APP_ENV
      )
        throw new Error('Browser analytics identity is unavailable');
      const existing = await tx.analyticsEvent.findMany({
        where: {
          environment: this.env.APP_ENV,
          eventId: { in: publicEvents.map((event) => event.eventId) },
        },
        select: { eventId: true },
      });
      const seen = new Set(existing.map((event) => event.eventId));
      const events = publicEvents.filter((event) => !seen.has(event.eventId));
      const sessionId =
        !visit.sessionId ||
        !visit.lastEventAt ||
        now.getTime() - visit.lastEventAt.getTime() >= 30 * 60_000
          ? randomUUID()
          : visit.sessionId;
      if (!events.length) return { accepted: 0, sessionId: visit.sessionId };
      const inserted = await tx.analyticsEvent.createMany({
        data: events.map((event) => ({
          eventId: event.eventId,
          sessionId,
          collectionVersion: 2,
          eventName: 'public_page_viewed',
          anonymousId: id,
          environment: this.env.APP_ENV,
          platform: 'web',
          properties: event.page as Prisma.InputJsonValue,
          createdAt: now,
        })),
        skipDuplicates: true,
      });
      if (inserted.count)
        await tx.acquisitionAttribution.update({
          where: { anonymousId: id },
          data: { sessionId, lastEventAt: now },
        });
      return { accepted: inserted.count, sessionId };
    });
    return { ...result, browserId: id };
  }

  async ingest(
    input: AnalyticsIngestRequest,
    authUserId?: string,
  ): Promise<AnalyticsIngestResponse> {
    const accepted = input.events.length;

    if (!this.env.ANALYTICS_INGEST_ENABLED) {
      return { accepted };
    }

    const now = this.clock.now();
    const userId = authUserId;

    if (input.attribution || input.claimAcquisition) {
      await this.upsertAttribution(input, userId, now);
    }

    if (input.events.length > 0) {
      await this.prisma.analyticsEvent.createMany({
        data: input.events.map((event) => ({
          eventName: event.name,
          anonymousId: input.anonymousId,
          userId: userId ?? null,
          properties: event.properties as Prisma.InputJsonValue,
          platform: input.platform ?? null,
          appVersion: input.appVersion ?? null,
          environment: input.environment,
          clientCapturedAt: event.clientCapturedAt
            ? new Date(event.clientCapturedAt)
            : null,
          createdAt: now,
        })),
      });
    }

    return { accepted };
  }

  private async upsertAttribution(
    input: AnalyticsIngestRequest,
    authUserId: string | undefined,
    now: Date,
  ): Promise<void> {
    const existing = await this.prisma.acquisitionAttribution.findUnique({
      where: { anonymousId: input.anonymousId },
    });

    if (!existing) {
      if (!input.attribution && !(input.claimAcquisition && authUserId)) {
        return;
      }

      let linkUserId: string | null = null;
      let linkedAt: Date | null = null;

      if (input.claimAcquisition && authUserId) {
        const claimedByOther =
          await this.prisma.acquisitionAttribution.findFirst({
            where: { userId: authUserId },
            select: { id: true },
          });

        if (!claimedByOther) {
          linkUserId = authUserId;
          linkedAt = now;
        }
      }

      try {
        await this.prisma.acquisitionAttribution.create({
          data: {
            anonymousId: input.anonymousId,
            source: input.attribution?.source ?? null,
            medium: input.attribution?.medium ?? null,
            campaign: input.attribution?.campaign ?? null,
            content: input.attribution?.content ?? null,
            referrer: input.attribution?.referrer ?? null,
            landingPath: input.attribution?.landingPath ?? null,
            capturedAt: now,
            userId: linkUserId,
            linkedAt,
          },
        });
      } catch (error) {
        const location = safeFailureLocation(error);
        this.logger.warn(
          location
            ? `Failed to create acquisition attribution at=${location}`
            : 'Failed to create acquisition attribution',
        );
      }
      return;
    }

    if (!input.claimAcquisition || !authUserId) {
      return;
    }

    if (existing.userId !== null) {
      return;
    }

    const claimedByOther = await this.prisma.acquisitionAttribution.findFirst({
      where: { userId: authUserId },
      select: { id: true },
    });

    if (claimedByOther) {
      return;
    }

    try {
      await this.prisma.acquisitionAttribution.update({
        where: { id: existing.id },
        data: {
          userId: authUserId,
          linkedAt: now,
        },
      });
    } catch (error) {
      const location = safeFailureLocation(error);
      this.logger.warn(
        location
          ? `Failed to claim acquisition attribution at=${location}`
          : 'Failed to claim acquisition attribution',
      );
    }
  }
}
