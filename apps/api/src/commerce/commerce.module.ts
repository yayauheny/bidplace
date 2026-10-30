import { Module } from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { AuthModule } from '../auth';
import { BidsService } from './bids.service';
import { CommerceGuards } from './commerce-guards';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [AuthModule],
  controllers: [ListingsController],
  providers: [ListingsService, BidsService, CommerceGuards, AdminGuard],
  exports: [ListingsService, CommerceGuards],
})
export class CommerceModule {}
