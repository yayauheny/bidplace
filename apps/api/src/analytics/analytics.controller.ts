import {
  SERVER_ENV,
  type ServerEnv,
  requiresProductionSecurity,
} from '../core/config';
import {
  ANALYTICS_BROWSER_COOKIE,
  analyticsBrowserId,
  signAnalyticsBrowser,
} from './browser-attribution';
import type { Request, Response } from 'express';
import {
  webAnalyticsRequestSchema,
  webAnalyticsResponseSchema,
  analyticsIngestRequestSchema,
  analyticsIngestResponseSchema,
  type AuthPrincipal,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  Inject,
} from '@nestjs/common';

import { CurrentUser, OptionalSessionAuthGuard } from '../auth';
import { RateLimit, RateLimitGuard } from '../antifraud';
import { parseBody } from '../core/validation';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Post('web-events')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'analytics:web',
    limit: 60,
    windowMs: 60_000,
    scope: 'ip',
  })
  async ingestWeb(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.analytics.ingestWeb(
      parseBody(webAnalyticsRequestSchema, body),
      analyticsBrowserId(request.headers.cookie, this.env),
    );
    response.setHeader('Cache-Control', 'private, no-store');
    if (result.browserId)
      response.cookie(
        ANALYTICS_BROWSER_COOKIE,
        signAnalyticsBrowser(result.browserId, this.env),
        {
          httpOnly: true,
          sameSite: 'lax',
          secure: requiresProductionSecurity(this.env),
          path: '/',
          maxAge: 30 * 86_400_000,
        },
      );
    return webAnalyticsResponseSchema.parse({
      accepted: result.accepted,
      sessionId: result.sessionId,
    });
  }

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
