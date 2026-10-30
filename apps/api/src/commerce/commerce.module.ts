import { Module } from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { AuthModule } from '../auth';
import { BidsService } from './bids.service';
import { CommerceGuards } from './commerce-guards';
import { ListingsController } from './listings.controller';
import { OrdersController } from './orders.controller';
import { ListingsService } from './listings.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule],
  controllers: [ListingsController, OrdersController],
  providers: [
    ListingsService,
    BidsService,
    OrdersService,
    CommerceGuards,
    AdminGuard,
  ],
  exports: [ListingsService, OrdersService, CommerceGuards],
})
export class CommerceModule {}
