import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Buffer } from 'node:buffer';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  publicSellerQuerySchema,
  publicSellerWorksQuerySchema,
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser, OptionalBearerAuthGuard } from '../auth';
import { CommerceEnabledGuard } from '../core/commerce';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import { parseBody } from '../core/validation';
import {
  acceptSupportedUploadMimeType,
  getImageCacheControl,
  productImageUploadLimits,
  type RawImageUpload,
  validateProductImageUploads,
} from '../images/image-policy';
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
  @UseGuards(BearerAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:profile-upload',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('profilePhoto', 1, {
      limits: {
        fileSize: productImageUploadLimits.maxFileBytes,
        files: 1,
      },
      fileFilter: (_request, file, done) =>
        acceptSupportedUploadMimeType(file.mimetype, done),
    }),
  )
  async create(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!files.length) {
      throw new BadRequestException('Profile photo is required');
    }

    const validatedFiles = await validateProductImageUploads(files);

    return this.sellers.create(
      auth.sub,
      parseBody(sellerProfileCreateRequestSchema, body),
      validatedFiles[0]!,
    );
  }

  @Patch('seller/profile')
  @UseGuards(BearerAuthGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:profile-upload',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('profilePhoto', 1, {
      limits: {
        fileSize: productImageUploadLimits.maxFileBytes,
        files: 1,
      },
      fileFilter: (_request, file, done) =>
        acceptSupportedUploadMimeType(file.mimetype, done),
    }),
  )
  async update(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    return this.sellers.update(
      auth.sub,
      parseBody(sellerProfileUpdateRequestSchema, body),
      files.length ? (await validateProductImageUploads(files))[0] : undefined,
    );
  }

  @Post('seller/profile/submit')
  @UseGuards(BearerAuthGuard)
  submitProfileRevision(@CurrentUser() auth: { sub: string }) {
    return this.sellers.submitProfileRevision(auth.sub);
  }

  @Get('seller/products')
  @UseGuards(BearerAuthGuard)
  listProducts(@CurrentUser() auth: { sub: string }) {
    return this.sellers.listProducts(auth.sub);
  }

  @Get('seller/products/:id')
  @UseGuards(BearerAuthGuard)
  getProduct(@CurrentUser() auth: { sub: string }, @Param('id') id: string) {
    return this.sellers.getProduct(auth.sub, id);
  }

  @Get('sellers')
  @UseGuards(CommerceEnabledGuard)
  listPublic(@Query() query: unknown) {
    return this.sellers.listPublic(parseBody(publicSellerQuerySchema, query));
  }

  @Get('sellers/:slug/detail')
  @UseGuards(CommerceEnabledGuard)
  getPublic(@Param('slug') slug: string, @Query() query: unknown) {
    return this.sellers.getPublic(
      slug,
      parseBody(publicSellerWorksQuerySchema, query),
    );
  }

  @Get('sellers/:slug/photo')
  @UseGuards(OptionalBearerAuthGuard)
  async getPhoto(
    @Param('slug') slug: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const photo = await this.sellers.getPhoto(slug, auth?.sub, auth?.role);
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({
        isPublic: photo.status === 'APPROVED',
        kind: 'seller-photo',
      }),
    );
    response.type(photo.profilePhotoMimeType);
    response.send(Buffer.from(photo.profilePhotoData));
  }
}
