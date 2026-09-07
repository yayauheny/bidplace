import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CommerceCapabilityModule } from '../core/commerce';
import { DatabaseModule } from '../core/database';
import { OrdersModule } from '../orders/orders.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminListingEmergencyService } from './admin-listing-emergency.service';
import { AdminModerationService } from './admin-moderation.service';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [AuthModule, CommerceCapabilityModule, DatabaseModule, OrdersModule, RealtimeModule],
  controllers: [AdminController],
  providers: [
    AdminGuard,
    AdminModerationService,
    AdminAnalyticsService,
    AdminUserService,
    AdminListingEmergencyService,
  ],
})
export class AdminModule {}
