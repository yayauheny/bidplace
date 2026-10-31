import { notificationSettingsSchema } from '@bidplace/contracts';
import type { AuthPrincipal } from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Put,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, SessionAuthGuard } from '../auth';
import { PrismaService } from '../core/database';
import { parseBody } from '../core/validation';

@Controller('me')
@UseGuards(SessionAuthGuard)
export class NotificationSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('notification-settings')
  async get(@CurrentUser() auth?: AuthPrincipal) {
    const userId = this.requireUser(auth);
    const row = await this.prisma.userNotificationSettings.findUnique({
      where: { userId },
      select: { outbidEmail: true },
    });
    return notificationSettingsSchema.parse({
      outbidEmail: row?.outbidEmail ?? true,
    });
  }

  @Put('notification-settings')
  async update(@Body() body: unknown, @CurrentUser() auth?: AuthPrincipal) {
    const userId = this.requireUser(auth);
    const input = parseBody(notificationSettingsSchema, body);
    const row = await this.prisma.userNotificationSettings.upsert({
      where: { userId },
      create: { userId, outbidEmail: input.outbidEmail },
      update: { outbidEmail: input.outbidEmail },
      select: { outbidEmail: true },
    });
    return notificationSettingsSchema.parse(row);
  }

  private requireUser(auth: AuthPrincipal | undefined): string {
    if (!auth) throw new UnauthorizedException('Missing authenticated user');
    return auth.sub;
  }
}
