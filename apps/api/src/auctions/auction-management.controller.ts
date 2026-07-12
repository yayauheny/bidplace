import {
  auctionCreateRequestSchema,
  auctionResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { AuctionsService } from './auctions.service';
import { parseBody } from '../core/validation';

@Controller('seller/auctions')
@UseGuards(BearerAuthGuard)
export class AuctionManagementController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Post()
  async createAuction(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
  ) {
    return auctionResponseSchema.parse(
      await this.auctionsService.createAuction(
        auth.sub,
        parseBody(auctionCreateRequestSchema, body),
      ),
    );
  }

  @Post(':auctionId/publish')
  async publishAuction(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('auctionId') auctionId: string,
  ) {
    return auctionResponseSchema.parse(
      await this.auctionsService.publishAuction(auth.sub, auctionId),
    );
  }
}
