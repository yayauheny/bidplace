import { Module } from '@nestjs/common';

import { AuctionBidsController } from './auction-bids.controller';
import { BidsService } from './bids.service';
import { SellerAuctionBidsController } from './seller-auction-bids.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [AuctionBidsController, SellerAuctionBidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
