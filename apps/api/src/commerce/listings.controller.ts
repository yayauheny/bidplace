import type {
  AdminRemoveListingRequest,
  AuthPrincipal,
} from '@bidplace/contracts';
import {
  adminRemoveListingRequestSchema,
  createListingRequestSchema,
  placeBidRequestSchema,
  purchaseRequestSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AdminGuard } from '../admin/admin.guard';
import { analyticsBrowserId } from '../analytics/browser-attribution';
import { RateLimit, RateLimitGuard, resolveClientIp } from '../antifraud';
import {
  CurrentUser,
  OptionalSessionAuthGuard,
  SessionAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import type { SessionRequest } from '../auth/session.service';
import { SERVER_ENV, type ServerEnv } from '../core/config';
import { parseBody } from '../core/validation';
import { BidsService } from './bids.service';
import { ListingsService } from './listings.service';
import { OrdersService } from './orders.service';

const uuid = new ParseUUIDPipe({ version: '4' });

@Controller()
export class ListingsController {
  constructor(
    private readonly listings: ListingsService,
    private readonly bids: BidsService,
    private readonly orders: OrdersService,
    @Inject(SERVER_ENV) private readonly env: ServerEnv,
  ) {}

  @Post('works/:productId/listings')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  create(
    @CurrentUser() auth: AuthPrincipal,
    @Param('productId', uuid) productId: string,
    @Body() body: unknown,
  ) {
    return this.listings.create(
      auth.sub,
      productId,
      parseBody(createListingRequestSchema, body),
    );
  }

  @Post('listings/:id/cancel')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  cancel(
    @CurrentUser() auth: AuthPrincipal,
    @Param('id', uuid) id: string,
  ) {
    return this.listings.cancelByAuthor(auth.sub, id);
  }

  @Post('admin/listings/:id/remove')
  @UseGuards(SessionAuthGuard, AdminGuard)
  remove(
    @CurrentUser() auth: AuthPrincipal,
    @Param('id', uuid) id: string,
    @Body() body: unknown,
  ) {
    const input: AdminRemoveListingRequest = parseBody(
      adminRemoveListingRequestSchema,
      body,
    );
    return this.listings.removeByAdmin(auth.sub, id, input);
  }

  @Post('listings/:id/bids')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'commerce:bid',
    limit: 10,
    windowMs: 60_000,
    scope: 'user-resource',
    resourceParam: 'id',
  })
  async placeBid(
    @CurrentUser() auth: AuthPrincipal,
    @Param('id', uuid) id: string,
    @Body() body: unknown,
    @Req() request: SessionRequest,
  ) {
    const input = parseBody(placeBidRequestSchema, body);
    const checkTurnstile = request.session.commerceBidTurnstileChecked !== true;
    const result = await this.bids.placeBid(auth.sub, id, {
      ...input,
      ip: resolveClientIp(request, this.env.TRUST_PROXY),
      browserId: analyticsBrowserId(request.headers.cookie, this.env),
      checkTurnstile,
    });
    request.session.commerceBidTurnstileChecked = true;
    return result;
  }

  @Post('listings/:id/purchase')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  async purchase(
    @CurrentUser() auth: AuthPrincipal,
    @Param('id', uuid) id: string,
    @Body() body: unknown,
    @Req() request: SessionRequest,
  ) {
    const input = parseBody(purchaseRequestSchema, body);
    return this.orders.purchase(auth.sub, id, {
      ...input,
      ip: resolveClientIp(request, this.env.TRUST_PROXY),
      browserId: analyticsBrowserId(request.headers.cookie, this.env),
      checkTurnstile: true,
    });
  }

  @Get('listings/:id/bids')
  @Header('Cache-Control', 'no-store')
  listBids(@Param('id', uuid) id: string) {
    return this.bids.list(id);
  }

  @Get('works/:publicId/lot')
  @Header('Cache-Control', 'no-store')
  @UseGuards(OptionalSessionAuthGuard)
  async lot(
    @Param('publicId') publicId: string,
    @CurrentUser() auth: AuthPrincipal | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const lot = await this.listings.getPublicLot(publicId, auth?.sub ?? null);
    response.status(200).json(lot);
  }
}
