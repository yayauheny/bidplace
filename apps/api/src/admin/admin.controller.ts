import {
  adminOrderCancellationRequestSchema,
  adminOrderReplacementRequestSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  sellerProfileResponseSchema,
} from '@bidplace/contracts';
import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { BearerAuthGuard } from '../auth';
import { PrismaService } from '../core/database';
import { parseBody } from '../core/validation';
import { OrdersService } from '../orders/orders.service';
import { productSelect, toContractProduct, toProductResponse } from '../products/products.mapper';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  @Get('seller-profiles')
  async listSellers() {
    const sellerProfiles = await this.prisma.sellerProfile.findMany({ orderBy: { createdAt: 'asc' } });
    return { sellerProfiles: sellerProfiles.map((sellerProfile) => ({ ...sellerProfile, createdAt: sellerProfile.createdAt.toISOString(), updatedAt: sellerProfile.updatedAt.toISOString() })) };
  }

  @Get('products')
  async listProducts() {
    const products = await this.prisma.product.findMany({ select: productSelect, orderBy: { createdAt: 'asc' } });
    return { products: products.map(toContractProduct) };
  }

  @Patch('seller-profiles/:id/status')
  async updateSeller(@Param('id') id: string, @Body() body: unknown) {
    const sellerProfile = await this.prisma.sellerProfile.update({
      where: { id },
      data: parseBody(adminSellerStatusUpdateRequestSchema, body),
    });
    return sellerProfileResponseSchema.parse({
      sellerProfile: {
        ...sellerProfile,
        createdAt: sellerProfile.createdAt.toISOString(),
        updatedAt: sellerProfile.updatedAt.toISOString(),
      },
    });
  }

  @Patch('products/:id/status')
  async updateProduct(@Param('id') id: string, @Body() body: unknown) {
    const input = parseBody(adminProductStatusUpdateRequestSchema, body);
    if (input.status === 'APPROVED') {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { images: { select: { id: true } } },
      });
      if (
        !product ||
        !product.title ||
        !product.story ||
        !product.categoryId ||
        !product.condition ||
        !product.uniqueness ||
        !product.provenance ||
        !product.city ||
        !product.deliveryInfo ||
        product.images.length < 3
      ) {
        throw new BadRequestException('Product does not meet approval requirements');
      }
    }
    const product = await this.prisma.product.update({
      where: { id },
      data: input,
      select: productSelect,
    });
    return toProductResponse(product);
  }

  @Get('listings/:listingId/bids')
  listRankedBids(@Param('listingId') listingId: string) {
    return this.orders.listRankedBids(listingId);
  }

  @Post('orders/:publicId/cancel')
  cancelOrder(@Param('publicId') publicId: string, @Body() body: unknown) {
    return this.orders.cancel(publicId, parseBody(adminOrderCancellationRequestSchema, body));
  }

  @Post('orders/:publicId/replacement')
  replaceOrder(@Param('publicId') publicId: string, @Body() body: unknown) {
    return this.orders.replace(publicId, parseBody(adminOrderReplacementRequestSchema, body));
  }
}
