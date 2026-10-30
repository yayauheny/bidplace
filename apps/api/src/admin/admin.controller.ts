import { SERVER_ENV, type ServerEnv } from '../core/config';
import {
  analyticsFoundationQuerySchema,
  adminQueueQuerySchema,
  adminHistoryQuerySchema,
  adminAnalyticsQuerySchema,
  adminModerationListQuerySchema,
  adminCuratorSelectionRequestSchema,
  adminCuratorSelectionResponseSchema,
  adminOkResponseSchema,
  adminProductStatusUpdateRequestSchema,
  adminSellerStatusUpdateRequestSchema,
  adminUserRevokeSessionsRequestSchema,
  adminReleaseHoldRequestSchema,
  adminUserStatusResponseSchema,
  adminUserStatusUpdateRequestSchema,
  adminUsersLookupQuerySchema,
  adminUsersLookupResponseSchema,
  catalogActiveSchema,
  catalogCategoryWriteSchema,
  catalogProposalMapSchema,
  catalogProposalRejectSchema,
  catalogRenameSchema,
  catalogTermSchema,
  catalogTermWriteSchema,
  categorySchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';

import { SessionAuthGuard, CurrentUser } from '../auth';
import { CatalogService } from '../catalog/catalog.service';
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
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly moderation: AdminModerationService,
    private readonly analytics: AdminAnalyticsService,
    private readonly users: AdminUserService,
    private readonly portfolio: PortfolioService,
    private readonly catalog: CatalogService,
    private readonly clock: Clock,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Get('analytics/foundation')
  @Header('Cache-Control', 'private, no-store')
  analyticsFoundation(@Query() query: unknown) {
    return this.analytics.buildFoundation(
      parseQuery(analyticsFoundationQuerySchema, query),
      this.clock.now(),
      this.env.APP_ENV,
      this.env.ANALYTICS_WEB_ENABLED,
    );
  }

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

  @Get('seller-profiles/summary')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  sellerSummaries(@Query() query: unknown) {
    return this.moderation.summaries(
      'SELLER_PROFILE',
      parseQuery(adminQueueQuerySchema, query),
    );
  }

  @Get('products/summary')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  productSummaries(@Query() query: unknown) {
    return this.moderation.summaries(
      'PRODUCT',
      parseQuery(adminQueueQuerySchema, query),
    );
  }

  @Get('seller-profiles/:id')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  sellerDetail(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.moderation.sellerDetail(id);
  }

  @Get('products/:id')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  productDetail(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.moderation.productDetail(id);
  }

  @Get('seller-profiles/:id/history')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  sellerHistory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: unknown,
  ) {
    return this.moderation.history(
      'SELLER_PROFILE',
      id,
      parseQuery(adminHistoryQuerySchema, query),
    );
  }

  @Get('products/:id/history')
  @Header('Cache-Control', PRIVATE_IMAGE_CACHE_CONTROL)
  productHistory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: unknown,
  ) {
    return this.moderation.history(
      'PRODUCT',
      id,
      parseQuery(adminHistoryQuerySchema, query),
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

  @Post('users/:id/release-hold')
  @Header('Cache-Control', 'private, no-store')
  async releaseUserHold(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const { note } = parseBody(adminReleaseHoldRequestSchema, body);
    await this.users.releaseHold(auth.sub, id, note);
    return adminOkResponseSchema.parse({ ok: true });
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

  @Post('categories')
  async createCategory(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
  ) {
    const category = await this.catalog.createCategory(
      auth.sub,
      parseBody(catalogCategoryWriteSchema, body),
    );
    return {
      category: categorySchema.parse({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        active: category.active,
      }),
    };
  }

  @Patch('categories/:id')
  async renameCategory(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const category = await this.catalog.renameCategory(
      auth.sub,
      id,
      parseBody(catalogRenameSchema, body).name,
    );
    return {
      category: categorySchema.parse({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        active: category.active,
      }),
    };
  }

  @Patch('categories/:id/active')
  async setCategoryActive(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const category = await this.catalog.setCategoryActive(
      auth.sub,
      id,
      parseBody(catalogActiveSchema, body).active,
    );
    return {
      category: categorySchema.parse({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        active: category.active,
      }),
    };
  }

  @Post('catalog/terms')
  async createTerm(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
  ) {
    const term = await this.catalog.createTerm(
      auth.sub,
      parseBody(catalogTermWriteSchema, body),
    );
    return { term: toTerm(term) };
  }

  @Patch('catalog/terms/:id')
  async renameTerm(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const term = await this.catalog.renameTerm(
      auth.sub,
      id,
      parseBody(catalogRenameSchema, body).name,
    );
    return { term: toTerm(term) };
  }

  @Patch('catalog/terms/:id/active')
  async setTermActive(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const term = await this.catalog.setTermActive(
      auth.sub,
      id,
      parseBody(catalogActiveSchema, body).active,
    );
    return { term: toTerm(term) };
  }

  @Post('catalog/proposals/:id/map')
  mapProposal(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.moderation.mapCatalogProposal(
      auth.sub,
      id,
      parseBody(catalogProposalMapSchema, body),
    );
  }

  @Post('catalog/proposals/:id/reject')
  rejectProposal(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    const parsed = parseBody(catalogProposalRejectSchema, body);
    return this.moderation.rejectCatalogProposal(auth.sub, id, parsed.reason);
  }
}

function toTerm(term: {
  id: string;
  role: 'MATERIAL' | 'TECHNIQUE';
  slug: string;
  name: string;
  active: boolean;
}) {
  return catalogTermSchema.parse({
    id: term.id,
    role: term.role,
    slug: term.slug,
    name: term.name,
    active: term.active,
  });
}
