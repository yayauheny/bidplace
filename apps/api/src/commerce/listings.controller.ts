import type {
  AdminRemoveListingRequest,
  AuthPrincipal,
} from '@bidplace/contracts';
import {
  adminRemoveListingRequestSchema,
  createListingRequestSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { AdminGuard } from '../admin/admin.guard';
import {
  CurrentUser,
  OptionalSessionAuthGuard,
  SessionAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import { parseBody } from '../core/validation';
import { ListingsService } from './listings.service';

const uuid = new ParseUUIDPipe({ version: '4' });

@Controller()
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

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
