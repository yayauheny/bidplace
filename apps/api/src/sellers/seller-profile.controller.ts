import {
  sellerProfileCreateRequestSchema,
  sellerProfileResponseSchema,
  sellerProfileUpdateRequestSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser, BearerAuthGuard } from '../auth';
import { SellersService } from './sellers.service';
import { parseBody } from '../core/validation';

@Controller('seller')
@UseGuards(BearerAuthGuard)
export class SellerProfileController {
  constructor(private readonly sellersService: SellersService) {}

  @Post('profile')
  async createProfile(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
  ) {
    return sellerProfileResponseSchema.parse(
      await this.sellersService.createProfile(
        auth.sub,
        parseBody(sellerProfileCreateRequestSchema, body),
      ),
    );
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
  ) {
    return sellerProfileResponseSchema.parse(
      await this.sellersService.updateProfile(
        auth.sub,
        parseBody(sellerProfileUpdateRequestSchema, body),
      ),
    );
  }
}
