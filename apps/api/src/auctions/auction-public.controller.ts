import {
  auctionListResponseSchema,
  publicAuctionDetailResponseSchema,
} from '@bidplace/contracts';
import { Controller, Get, Param } from '@nestjs/common';

import { AuctionsService } from './auctions.service';

@Controller('auctions')
export class AuctionPublicController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  async listAuctions() {
    return auctionListResponseSchema.parse(
      await this.auctionsService.listPublicAuctions(),
    );
  }

  @Get(':slug')
  async getAuction(@Param('slug') slug: string) {
    return publicAuctionDetailResponseSchema.parse(
      await this.auctionsService.getPublicAuction(slug),
    );
  }
}
