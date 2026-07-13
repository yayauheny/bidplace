import {
  auctionCreateRequestSchema,
  auctionResponseSchema,
  sellerAuctionListResponseSchema,
  paginationQuerySchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { AuctionsService } from './auctions.service';
import { parseBody, parseQuery } from '../core/validation';

@Controller('seller/auctions')
@UseGuards(BearerAuthGuard)
export class AuctionManagementController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  async listMyAuctions(
    @CurrentUser() auth: AuthTokenPayload,
    @Query() query: unknown,
  ) {
    return sellerAuctionListResponseSchema.parse(
      await this.auctionsService.listMyAuctions(
        auth.sub,
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }

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
