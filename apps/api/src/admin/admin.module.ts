import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CatalogModule } from '../catalog/catalog.module';
import { DatabaseModule } from '../core/database';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminModerationService } from './admin-moderation.service';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [AuthModule, CatalogModule, DatabaseModule, PortfolioModule],
  controllers: [AdminController],
  providers: [
    AdminGuard,
    AdminModerationService,
    AdminAnalyticsService,
    AdminUserService,
  ],
})
export class AdminModule {}
