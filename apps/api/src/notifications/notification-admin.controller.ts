import type { AuthPrincipal } from '@bidplace/contracts';
import {
  Controller,
  Get,
  Inject,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser, SessionAuthGuard } from '../auth';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { PrismaService } from '../core/database';
import { TickService } from '../core/tick/tick.service';
import { NotificationDeliveryService } from './notification-delivery.service';

export function isTickCronConfigured(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

@Controller('admin')
@UseGuards(SessionAuthGuard, AdminGuard)
export class NotificationAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tick: TickService,
    private readonly delivery: NotificationDeliveryService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Get('health')
  async health() {
    const [lastTickAt, liveAuctions, failedNotifications, openReports, oldest] =
      await Promise.all([
        this.tick.lastSucceededAt(),
        this.prisma.listing.count({ where: { status: 'LIVE' } }),
        this.prisma.notificationOutbox.count({ where: { status: 'FAILED' } }),
        this.prisma.report.count({ where: { status: 'OPEN' } }),
        this.prisma.report.findFirst({
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      lastTickAt: lastTickAt?.toISOString() ?? null,
      cronConfigured: isTickCronConfigured(this.env.TICK_CRON),
      liveAuctions,
      failedNotifications,
      openReports,
      oldestOpenReportAt: oldest?.createdAt.toISOString() ?? null,
    };
  }

  @Post('notifications/retry-failed')
  retryFailed(@CurrentUser() auth?: AuthPrincipal) {
    if (!auth) throw new UnauthorizedException('Missing authenticated user');
    return this.delivery.retryFailed(auth.sub);
  }
}
