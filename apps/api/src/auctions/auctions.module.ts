import { Module } from '@nestjs/common';

import { AuctionLifecycleScheduler } from './auction-closing.scheduler';
import { AuctionLifecycleService } from './auction-closing.service';
import { AuctionManagementController } from './auction-management.controller';
import { AuctionPublicController } from './auction-public.controller';
import { AuctionsService } from './auctions.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';
import { RealtimeModule } from '../core/realtime';

@Module({
  imports: [AuthModule, DatabaseModule, RealtimeModule],
  controllers: [AuctionManagementController, AuctionPublicController],
  providers: [
    AuctionsService,
    AuctionLifecycleService,
    AuctionLifecycleScheduler,
  ],
  exports: [AuctionsService, AuctionLifecycleService],
})
export class AuctionsModule {}
