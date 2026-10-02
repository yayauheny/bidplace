import {
  adminAnalyticsQuerySchema,
  adminModerationListQuerySchema,
  adminCuratorSelectionRequestSchema,
  adminCuratorSelectionResponseSchema,
  adminOkResponseSchema,
  adminProductStatusUpdateRequestSchema,
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
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { Clock } from '../core/time';
import { parseBody, parseQuery } from '../core/validation';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PRIVATE_IMAGE_CACHE_CONTROL } from '../images/image-policy';
import { toSellerProfileResponse } from '../sellers/seller-profile.mapper';
import { AdminGuard } from './admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminModerationService } from './admin-moderation.service';
import { AdminUserService } from './admin-user.service';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(
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
  async listSellers(@Query() query: unknown) {
    return this.moderation.listSellerProfiles(
      parseQuery(adminModerationListQuerySchema, query),
    );
  }

  @Get('seller-profiles/:id/revisions/:revisionId/photo')
  async sellerRevisionPhoto(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('revisionId', new ParseUUIDPipe({ version: '4' }))
    revisionId: string,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const photo = await this.moderation.getSellerRevisionPhoto(id, revisionId);
    response.setHeader('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL);
    response.type(photo.mimeType);
    response.send(Buffer.from(photo.bytes));
  }

  @Get('products')
  async listProducts(@Query() query: unknown) {
    return this.moderation.listProducts(
      parseQuery(adminModerationListQuerySchema, query),
    );
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
    return this.moderation.updateProductStatusAndReadback(
      auth.sub,
      id,
      parseBody(adminProductStatusUpdateRequestSchema, body),
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
