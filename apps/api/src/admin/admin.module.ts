import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { AdminGuard } from './admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { AdminModerationService } from './admin-moderation.service';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [AuthModule, DatabaseModule, PortfolioModule],
  controllers: [AdminController],
  providers: [
    AdminGuard,
    AdminModerationService,
    AdminAnalyticsService,
    AdminUserService,
  ],
})
export class AdminModule {}
