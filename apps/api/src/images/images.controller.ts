import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Buffer } from 'node:buffer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { productImageOrderRequestSchema } from '@bidplace/contracts';
import { BearerAuthGuard, CurrentUser, OptionalBearerAuthGuard } from '../auth';
import { parseBody } from '../core/validation';
import {
  getImageCacheControl,
  productImageUploadLimits,
  supportedImageMimeTypes,
  type RawImageUpload,
  validateProductImageUploads,
} from './image-policy';
import { ImagesService } from './images.service';

@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Post('products/:productId/images')
  @UseGuards(BearerAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', productImageUploadLimits.maxFiles, {
      limits: {
        fileSize: productImageUploadLimits.maxFileBytes,
        files: productImageUploadLimits.maxFiles,
      },
      fileFilter: (_request, file, done) =>
        done(null, supportedImageMimeTypes.includes(file.mimetype as never)),
    }),
  )
  async add(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!files.length)
      throw new BadRequestException('At least one image is required');
    return this.images.add(
      auth.sub,
      productId,
      await validateProductImageUploads(files),
    );
  }

  @Delete('products/:productId/images/:imageId')
  @UseGuards(BearerAuthGuard)
  remove(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.images.remove(auth.sub, productId, imageId);
  }

  @Patch('products/:productId/images/order')
  @UseGuards(BearerAuthGuard)
  reorder(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @Body() body: unknown,
  ) {
    return this.images.reorder(
      auth.sub,
      productId,
      parseBody(productImageOrderRequestSchema, body).imageIds,
    );
  }

  @Get('images/:id')
  @UseGuards(OptionalBearerAuthGuard)
  async get(
    @Param('id') id: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const image = await this.images.get(id, auth?.sub, auth?.role);
    response.setHeader('Cache-Control', getImageCacheControl(image.isPublic));
    response.type(image.mimeType);
    response.send(Buffer.from(image.data));
  }
}
