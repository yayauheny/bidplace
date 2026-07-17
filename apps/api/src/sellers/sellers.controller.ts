import {
  publicSellerDetailResponseSchema,
  sellerProfileResponseSchema,
} from '@bidplace/contracts';
import { Controller, Get, Param } from '@nestjs/common';

import { SellersService } from './sellers.service';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get(':slug/detail')
  async getPublicDetail(@Param('slug') slug: string) {
    return publicSellerDetailResponseSchema.parse(
      await this.sellersService.getPublicDetail(slug),
    );
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return sellerProfileResponseSchema.parse(
      await this.sellersService.getPublicProfile(slug),
    );
  }
}
