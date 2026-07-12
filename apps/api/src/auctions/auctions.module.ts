import { Module } from '@nestjs/common';

import { AuctionClosingScheduler } from './auction-closing.scheduler';
import { AuctionClosingService } from './auction-closing.service';
import { AuctionManagementController } from './auction-management.controller';
import { AuctionsService } from './auctions.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';
import { RealtimeModule } from '../core/realtime';

@Module({
  imports: [AuthModule, DatabaseModule, RealtimeModule],
  controllers: [AuctionManagementController],
  providers: [
    AuctionsService,
    AuctionClosingService,
    AuctionClosingScheduler,
  ],
  exports: [AuctionsService, AuctionClosingService],
})
export class AuctionsModule {}
