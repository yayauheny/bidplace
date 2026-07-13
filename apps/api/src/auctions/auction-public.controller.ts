import {
  auctionListResponseSchema,
  paginationQuerySchema,
  publicAuctionDetailResponseSchema,
} from '@bidplace/contracts';
import { Controller, Get, Param, Query } from '@nestjs/common';

import { AuctionsService } from './auctions.service';
import { parseQuery } from '../core/validation';

@Controller('auctions')
export class AuctionPublicController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  async listAuctions(@Query() query: unknown) {
    return auctionListResponseSchema.parse(
      await this.auctionsService.listPublicAuctions(
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }

  @Get(':slug')
  async getAuction(@Param('slug') slug: string, @Query() query: unknown) {
    return publicAuctionDetailResponseSchema.parse(
      await this.auctionsService.getPublicAuction(
        slug,
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }
}
