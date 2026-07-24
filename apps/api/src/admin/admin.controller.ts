import {
  adminOrderCancellationRequestSchema,
  adminOrderReplacementRequestSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { PrismaService } from '../core/database';
import { parseBody } from '../core/validation';
import { OrdersService } from '../orders/orders.service';
import {
  productSelect,
  toContractProduct,
  toProductResponse,
} from '../products/products.mapper';
import {
  sellerProfileResponseSelect,
  toSellerProfileResponse,
} from '../sellers/seller-profile.mapper';
import { AdminGuard } from './admin.guard';
import { AdminModerationService } from './admin-moderation.service';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly moderation: AdminModerationService,
  ) {}

  @Get('seller-profiles')
  async listSellers() {
    const sellerProfiles = await this.prisma.sellerProfile.findMany({
      select: sellerProfileResponseSelect,
      orderBy: { createdAt: 'asc' },
    });

    return {
      sellerProfiles: sellerProfiles.map((sellerProfile) =>
        toSellerProfileResponse(sellerProfile).sellerProfile,
      ),
    };
  }

  @Get('products')
  async listProducts() {
    const products = await this.prisma.product.findMany({
      select: productSelect,
      orderBy: { createdAt: 'asc' },
    });

    return { products: products.map(toContractProduct) };
  }

  @Patch('seller-profiles/:id/status')
  async updateSeller(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const sellerProfile = await this.moderation.updateSellerStatus(
      auth.sub,
      id,
      parseBody(adminSellerStatusUpdateRequestSchema, body),
    );

    return toSellerProfileResponse(sellerProfile);
  }

  @Patch('products/:id/status')
  async updateProduct(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const product = await this.moderation.updateProductStatus(
      auth.sub,
      id,
      parseBody(adminProductStatusUpdateRequestSchema, body),
    );

    return toProductResponse(await this.prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: productSelect,
    }));
  }

  @Get('listings/:listingId/bids')
  listRankedBids(@Param('listingId') listingId: string) {
    return this.orders.listRankedBids(listingId);
  }

  @Post('orders/:publicId/cancel')
  cancelOrder(
    @CurrentUser() auth: { sub: string },
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return this.orders.cancel(
      auth.sub,
      publicId,
      parseBody(adminOrderCancellationRequestSchema, body),
    );
  }

  @Post('orders/:publicId/replacement')
  replaceOrder(
    @CurrentUser() auth: { sub: string },
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return this.orders.replace(
      auth.sub,
      publicId,
      parseBody(adminOrderReplacementRequestSchema, body),
    );
  }
}
