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
  sellerProfileCreateRequestSchema,
  sellerProfileUpdateRequestSchema,
} from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser, OptionalBearerAuthGuard } from '../auth';
import { parseBody } from '../core/validation';
import {
  getImageCacheControl,
  productImageUploadLimits,
  supportedImageMimeTypes,
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
  @UseGuards(BearerAuthGuard)
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
  @UseGuards(BearerAuthGuard)
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
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    return this.sellers.update(
      auth.sub,
      parseBody(sellerProfileUpdateRequestSchema, body),
      files.length ? (await validateProductImageUploads(files))[0] : undefined,
    );
  }

  @Get('seller/products')
  @UseGuards(BearerAuthGuard)
  listProducts(@CurrentUser() auth: { sub: string }) {
    return this.sellers.listProducts(auth.sub);
  }

  @Get('sellers')
  listPublic(@Query() query: unknown) {
    return this.sellers.listPublic(
      parseBody(publicSellerQuerySchema, query),
    );
  }

  @Get('sellers/:slug/detail')
  getPublic(@Param('slug') slug: string) {
    return this.sellers.getPublic(slug);
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
      getImageCacheControl(photo.status === 'APPROVED'),
    );
    response.type(photo.profilePhotoMimeType);
    response.send(Buffer.from(photo.profilePhotoData));
  }
}
