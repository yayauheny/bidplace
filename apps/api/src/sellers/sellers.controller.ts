import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { parseBody } from '../core/validation';
import { SellersService } from './sellers.service';

@Controller()
export class SellersController {
  constructor(private readonly sellers: SellersService) {}

  @Get('seller/profile')
  @UseGuards(BearerAuthGuard)
  getMine(@CurrentUser() auth: { sub: string }) {
    return this.sellers.getMine(auth.sub);
  }

  @Post('seller/profile')
  @UseGuards(BearerAuthGuard)
  create(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.sellers.create(auth.sub, parseBody(sellerProfileCreateRequestSchema, body));
  }

  @Patch('seller/profile')
  @UseGuards(BearerAuthGuard)
  update(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.sellers.update(auth.sub, parseBody(sellerProfileUpdateRequestSchema, body));
  }

  @Get('seller/products')
  @UseGuards(BearerAuthGuard)
  listProducts(@CurrentUser() auth: { sub: string }) {
    return this.sellers.listProducts(auth.sub);
  }

  @Get('sellers/:slug/detail')
  getPublic(@Param('slug') slug: string) {
    return this.sellers.getPublic(slug);
  }
}
