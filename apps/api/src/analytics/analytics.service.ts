import {
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
