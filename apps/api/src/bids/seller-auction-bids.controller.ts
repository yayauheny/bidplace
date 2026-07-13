import {
  bidHistoryResponseSchema,
  type AuthTokenPayload,
  paginationQuerySchema,
} from '@bidplace/contracts';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { BidsService } from './bids.service';
import { parseQuery } from '../core/validation';

@Controller('seller/auctions')
@UseGuards(BearerAuthGuard)
export class SellerAuctionBidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Get(':auctionId/bids')
  async listBids(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('auctionId') auctionId: string,
    @Query() query: unknown,
  ) {
    return bidHistoryResponseSchema.parse(
      await this.bidsService.listAuctionBids(
        auth.sub,
        auctionId,
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }
}
