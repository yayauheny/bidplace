import {
  bidHistoryResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { BidsService } from './bids.service';

@Controller('seller/auctions')
@UseGuards(BearerAuthGuard)
export class SellerAuctionBidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Get(':auctionId/bids')
  async listBids(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('auctionId') auctionId: string,
  ) {
    return bidHistoryResponseSchema.parse(
      await this.bidsService.listAuctionBids(auth.sub, auctionId),
    );
  }
}
