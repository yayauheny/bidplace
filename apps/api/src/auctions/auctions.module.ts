import { Module } from '@nestjs/common';

import { AuctionManagementController } from './auction-management.controller';
import { AuctionsService } from './auctions.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AuctionManagementController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
