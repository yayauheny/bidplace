import {
  bidCreateRequestSchema,
  bidPlacementResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { BidsService } from './bids.service';
import { parseBody } from '../core/validation';

@Controller('auctions')
@UseGuards(BearerAuthGuard)
export class AuctionBidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post(':auctionId/bids')
  async placeBid(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('auctionId') auctionId: string,
    @Body() body: unknown,
  ) {
    return bidPlacementResponseSchema.parse(
      await this.bidsService.placeBid(
        auth.sub,
        auctionId,
        parseBody(bidCreateRequestSchema, body),
      ),
    );
  }
}
