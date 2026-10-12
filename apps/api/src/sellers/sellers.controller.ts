import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Buffer } from 'node:buffer';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '@bidplace/contracts';

import {
  BearerAuthGuard,
  CurrentUser,
  OptionalBearerAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import {
  getImageCacheControl,
  productImageUploadLimits,
  supportedImageMimeTypes,
  type RawImageUpload,
  validateProductImageUploads,
} from '../images/image-policy';
import {
  parseSellerProfileWriteBody,
  type ContentTypeRequest,
} from './seller-profile-write-body';
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
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:profile-photo-upload',
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
        done(null, supportedImageMimeTypes.includes(file.mimetype as never)),
    }),
  )
  async create(
    @CurrentUser() auth: { sub: string },
    @Req() request: ContentTypeRequest,
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!files.length) {
      throw new BadRequestException('Profile photo is required');
    }

    const validatedFiles = await validateProductImageUploads(files);

    return this.sellers.create(
      auth.sub,
      parseSellerProfileWriteBody(
        sellerProfileCreateRequestSchema,
        body,
        request,
      ),
      validatedFiles[0]!,
    );
  }

  @Patch('seller/profile')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:profile-photo-upload',
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
        done(null, supportedImageMimeTypes.includes(file.mimetype as never)),
    }),
  )
  async update(
    @CurrentUser() auth: { sub: string },
    @Req() request: ContentTypeRequest,
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    return this.sellers.update(
      auth.sub,
      parseSellerProfileWriteBody(
        sellerProfileUpdateRequestSchema,
        body,
        request,
      ),
      files.length ? (await validateProductImageUploads(files))[0] : undefined,
    );
  }

  @Get('seller/products')
  @UseGuards(BearerAuthGuard)
  listProducts(@CurrentUser() auth: { sub: string }) {
    return this.sellers.listProducts(auth.sub);
  }

  @Get('seller/products/:id')
  @UseGuards(BearerAuthGuard)
  getProduct(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.sellers.getProduct(auth.sub, id);
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
        isPublic: photo.isPublic,
        kind: 'seller-photo',
      }),
    );
    response.type(photo.profilePhotoMimeType);
    response.send(Buffer.from(photo.profilePhotoData));
  }
}
