import {
  adminProductsResponseSchema,
  adminOrderCancellationRequestSchema,
  adminOrderReplacementRequestSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerProfilesResponseSchema,
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
import { type Prisma } from '@bidplace/database';

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

const adminProductSelect = {
  ...productSelect,
  creationIntro: true,
  creationSteps: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      position: true,
      title: true,
      body: true,
      mimeType: true,
      byteLength: true,
      checksum: true,
      width: true,
      height: true,
    },
  },
  sellerProfile: { select: { slug: true, fullName: true, status: true } },
  listings: {
    where: { status: { in: ['SCHEDULED', 'LIVE'] } },
    select: { status: true },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

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
    const ids = sellerProfiles.map(({ id }) => id);
    const [liveSellerIds, auditEvents] = await Promise.all([
      this.prisma.sellerProfile.findMany({
        where: {
          id: { in: ids },
          products: {
            some: {
              listings: { some: { status: { in: ['SCHEDULED', 'LIVE'] } } },
            },
          },
        },
        select: { id: true },
      }),
      this.prisma.auditEvent.findMany({
        where: {
          targetType: 'SELLER_PROFILE',
          targetId: { in: ids },
          reason: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { targetId: true, reason: true },
      }),
    ]);
    const liveIds = new Set(liveSellerIds.map(({ id }) => id));
    const reasons = new Map<string, string>();
    for (const event of auditEvents) {
      if (event.reason && !reasons.has(event.targetId)) {
        reasons.set(event.targetId, event.reason);
      }
    }

    return adminSellerProfilesResponseSchema.parse({
      sellerProfiles: sellerProfiles.map((sellerProfile) => ({
        ...toSellerProfileResponse(sellerProfile).sellerProfile,
        lastModerationReason: reasons.get(sellerProfile.id) ?? null,
        hasBlockingListing: liveIds.has(sellerProfile.id),
      })),
    });
  }

  @Get('products')
  async listProducts() {
    const products = await this.prisma.product.findMany({
      select: adminProductSelect,
      orderBy: { createdAt: 'asc' },
    });
    const ids = products.map(({ id }) => id);
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: {
        targetType: 'PRODUCT',
        targetId: { in: ids },
        reason: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { targetId: true, reason: true },
    });
    const reasons = new Map<string, string>();
    for (const event of auditEvents) {
      if (event.reason && !reasons.has(event.targetId)) {
        reasons.set(event.targetId, event.reason);
      }
    }

    return adminProductsResponseSchema.parse({
      products: products.map((product) => {
        const contractProduct = toContractProduct(product);

        return {
          ...contractProduct,
          sellerProfile: product.sellerProfile,
          creationIntro: product.creationIntro ?? null,
          creationSteps: product.creationSteps.map((step) => ({
            id: step.id,
            position: step.position,
            title: step.title,
            body: step.body,
            image:
              step.mimeType && step.byteLength && step.checksum
                ? {
                    url: `/api/creation-steps/${step.id}/image`,
                    mimeType: step.mimeType,
                    byteLength: step.byteLength,
                    checksum: step.checksum,
                    width: step.width,
                    height: step.height,
                  }
                : null,
          })),
          hasBlockingListing: product.listings.length > 0,
          lastModerationReason: reasons.get(product.id) ?? null,
        };
      }),
    });
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

    return toProductResponse(
      await this.prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: productSelect,
      }),
    );
  }

  @Get('listings/:listingId/bids')
  listRankedBids(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('listingId') listingId: string,
  ) {
    return this.orders.listRankedBids(auth.sub, auth.role, listingId);
  }

  @Post('orders/:publicId/cancel')
  cancelOrder(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return this.orders.cancel(
      auth.sub,
      auth.role,
      publicId,
      parseBody(adminOrderCancellationRequestSchema, body),
    );
  }

  @Post('orders/:publicId/replacement')
  replaceOrder(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return this.orders.replace(
      auth.sub,
      auth.role,
      publicId,
      parseBody(adminOrderReplacementRequestSchema, body),
    );
  }
}
