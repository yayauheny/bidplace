import type { AuthPrincipal } from '@bidplace/contracts';
import {
  adminReportsQuerySchema,
  adminReportsResponseSchema,
  createReportRequestSchema,
  reportSchema,
  resolveReportRequestSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { RateLimit, RateLimitGuard } from '../antifraud';
import { CurrentUser, SessionAuthGuard, VerifiedEmailGuard } from '../auth';
import { parseBody, parseQuery } from '../core/validation';
import { ReportsService } from './reports.service';

const PUBLIC_ID = /^[A-Za-z0-9_-]{11}$/;
const HOUR_MS = 60 * 60 * 1000;

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('orders/:publicId/reports')
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'commerce:report',
    limit: 5,
    windowMs: HOUR_MS,
    scope: 'user',
  })
  async create(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return reportSchema.parse(
      await this.reports.create(
        auth.sub,
        orderPublicId(publicId),
        parseBody(createReportRequestSchema, body),
      ),
    );
  }

  @Get('admin/reports')
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, AdminGuard)
  async list(@Query() query: unknown) {
    const input = parseQuery(adminReportsQuerySchema, query);
    return adminReportsResponseSchema.parse(
      await this.reports.list(input.status),
    );
  }

  @Post('admin/reports/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, AdminGuard)
  async resolve(
    @CurrentUser() auth: AuthPrincipal,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return reportSchema.parse(
      await this.reports.resolve(
        auth.sub,
        id,
        parseBody(resolveReportRequestSchema, body),
      ),
    );
  }
}

function orderPublicId(value: string): string {
  if (!PUBLIC_ID.test(value)) throw new NotFoundException('Order not found');
  return value;
}
