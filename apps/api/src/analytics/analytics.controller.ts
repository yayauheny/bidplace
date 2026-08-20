import {
  analyticsIngestRequestSchema,
  analyticsIngestResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, OptionalBearerAuthGuard } from '../auth';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import { parseBody } from '../core/validation';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  @UseGuards(OptionalBearerAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'analytics:ingest',
    limit: 60,
    windowMs: 60_000,
    scope: 'ip',
  })
  async ingest(
    @CurrentUser() auth: AuthTokenPayload | undefined,
    @Body() body: unknown,
  ) {
    const result = await this.analytics.ingest(
      parseBody(analyticsIngestRequestSchema, body),
      auth?.sub,
    );

    return analyticsIngestResponseSchema.parse(result);
  }
}
