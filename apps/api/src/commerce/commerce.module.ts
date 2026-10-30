import { Module } from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { AuthModule } from '../auth';
import { RateLimitModule } from '../antifraud';
import { BidsService } from './bids.service';
import { CommerceGuards } from './commerce-guards';
import { CommerceTickService } from './commerce-tick';
import { ListingsController } from './listings.controller';
import { OrdersController } from './orders.controller';
import { ListingsService } from './listings.service';
import { OrdersService } from './orders.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, RateLimitModule],
  controllers: [ListingsController, OrdersController, ReportsController],
  providers: [
    ListingsService,
    BidsService,
    OrdersService,
    ReportsService,
    CommerceTickService,
    CommerceGuards,
    AdminGuard,
  ],
  exports: [ListingsService, OrdersService, CommerceGuards],
})
export class CommerceModule {}
