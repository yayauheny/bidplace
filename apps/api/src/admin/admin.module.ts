import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { OrdersModule } from '../orders/orders.module';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminModerationService } from './admin-moderation.service';

@Module({
  imports: [AuthModule, DatabaseModule, OrdersModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminModerationService, AdminAnalyticsService],
})
export class AdminModule {}
