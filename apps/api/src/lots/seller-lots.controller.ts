import { sellerLotListResponseSchema, paginationQuerySchema } from '@bidplace/contracts';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { LotsService } from './lots.service';
import { parseQuery } from '../core/validation';

@Controller('seller/lots')
@UseGuards(BearerAuthGuard)
export class SellerLotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Get()
  async listMyLots(@CurrentUser() auth: { sub: string }, @Query() query: unknown) {
    return sellerLotListResponseSchema.parse(
      await this.lotsService.listMyLots(
        auth.sub,
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }
}
