import {
  adminAnalyticsQuerySchema,
  adminCuratorSelectionRequestSchema,
  adminCuratorSelectionResponseSchema,
  adminOkResponseSchema,
  adminProductStatusUpdateRequestSchema,
  adminProductsResponseSchema,
  adminSellerProfilesResponseSchema,
  adminSellerStatusUpdateRequestSchema,
  adminUserRevokeSessionsRequestSchema,
  adminUserStatusResponseSchema,
  adminUserStatusUpdateRequestSchema,
  adminUsersLookupQuerySchema,
  adminUsersLookupResponseSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { type Prisma } from '@bidplace/database';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { PrismaService } from '../core/database';
import { Clock } from '../core/time';
import { parseBody, parseQuery } from '../core/validation';
import { PortfolioService } from '../portfolio/portfolio.service';
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
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminModerationService } from './admin-moderation.service';
import { AdminUserService } from './admin-user.service';

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
    private readonly moderation: AdminModerationService,
    private readonly analytics: AdminAnalyticsService,
    private readonly users: AdminUserService,
    private readonly portfolio: PortfolioService,
    private readonly clock: Clock,
  ) {}

  @Get('analytics/overview')
  async analyticsOverview(@Query() query: unknown) {
    return this.analytics.buildOverview(
      parseQuery(adminAnalyticsQuerySchema, query),
      this.clock.now(),
    );
  }

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

  @Get('users')
  async lookupUsers(@Query() query: unknown) {
    const parsed = parseQuery(adminUsersLookupQuerySchema, query);
    return adminUsersLookupResponseSchema.parse(
      await this.users.lookupByEmail(parsed.email),
    );
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return adminUserStatusResponseSchema.parse(
      await this.users.updateStatus(
        auth.sub,
        id,
        parseBody(adminUserStatusUpdateRequestSchema, body),
      ),
    );
  }

  @Post('users/:id/revoke-sessions')
  async revokeUserSessions(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return adminUserStatusResponseSchema.parse(
      await this.users.revokeSessions(
        auth.sub,
        id,
        parseBody(adminUserRevokeSessionsRequestSchema, body),
      ),
    );
  }

  @Put('curator-selection')
  async setCuratorSelection(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
  ) {
    const parsed = parseBody(adminCuratorSelectionRequestSchema, body);
    return adminCuratorSelectionResponseSchema.parse(
      await this.portfolio.setCuratorSelection(
        parsed.publicId,
        parsed.curatorSlug,
        parsed.note,
        auth.sub,
      ),
    );
  }

  @Delete('curator-selection')
  async clearCuratorSelection() {
    return adminOkResponseSchema.parse(
      await this.portfolio.clearCuratorSelection(),
    );
  }
}
