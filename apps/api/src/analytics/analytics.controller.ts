import {
  analyticsIngestRequestSchema,
  analyticsIngestResponseSchema,
  type AuthPrincipal,
} from '@bidplace/contracts';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, OptionalSessionAuthGuard } from '../auth';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import { parseBody } from '../core/validation';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post('events')
  @UseGuards(OptionalSessionAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'analytics:ingest',
    limit: 60,
    windowMs: 60_000,
    scope: 'ip',
  })
  async ingest(
    @CurrentUser() auth: AuthPrincipal | undefined,
    @Body() body: unknown,
  ) {
    const result = await this.analytics.ingest(
      parseBody(analyticsIngestRequestSchema, body),
      auth?.sub,
    );

    return analyticsIngestResponseSchema.parse(result);
  }
}
