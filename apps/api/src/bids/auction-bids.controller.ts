import {
  bidCreateRequestSchema,
  bidPlacementResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { BidsService } from './bids.service';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';

@Controller('auctions')
@UseGuards(BearerAuthGuard)
export class AuctionBidsController {
  constructor(private readonly bidsService: BidsService) {}

  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'bids:place',
    limit: 15,
    windowMs: 60_000,
    scope: 'user-resource',
    resourceParam: 'auctionId',
  })
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
