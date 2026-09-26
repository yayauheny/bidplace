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
import {
  BearerAuthGuard,
  CurrentUser,
  OptionalBearerAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import { parseBody } from '../core/validation';
import { RateLimit } from '../core/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../core/rate-limit/rate-limit.guard';
import {
  getImageCacheControl,
  productImageUploadLimits,
  supportedImageMimeTypes,
  type RawImageUpload,
} from './image-policy';
import { ImagesService } from './images.service';

function acceptSupportedUploadMimeType(
  mimetype: string,
  done: (error: Error | null, accept: boolean) => void,
): void {
  if (supportedImageMimeTypes.includes(mimetype as never)) {
    done(null, true);
    return;
  }

  done(new BadRequestException('Unsupported image type'), false);
}

@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Post('products/:productId/images')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:product-upload',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('images', productImageUploadLimits.maxFiles, {
      limits: {
        fileSize: productImageUploadLimits.maxFileBytes,
        files: productImageUploadLimits.maxFiles,
      },
      fileFilter: (_request, file, done) =>
        acceptSupportedUploadMimeType(file.mimetype, done),
    }),
  )
  async add(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!files.length)
      throw new BadRequestException('At least one image is required');
    return this.images.add(auth.sub, productId, files);
  }

  @Post('products/:productId/creation-steps/:stepId/image')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:creation-step-upload',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('image', 1, {
      limits: {
        fileSize: productImageUploadLimits.maxFileBytes,
        files: 1,
      },
      fileFilter: (_request, file, done) =>
        acceptSupportedUploadMimeType(file.mimetype, done),
    }),
  )
  async addCreationStepImage(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @Param('stepId') stepId: string,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!files.length) throw new BadRequestException('An image is required');
    return this.images.addCreationStepImage(
      auth.sub,
      productId,
      stepId,
      files[0]!,
    );
  }

  @Delete('products/:productId/images/:imageId')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  remove(
    @CurrentUser() auth: { sub: string },
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.images.remove(auth.sub, productId, imageId);
  }

  @Patch('products/:productId/images/order')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
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
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({ isPublic: image.isPublic, kind: 'product' }),
    );
    response.type(image.mimeType);
    response.send(Buffer.from(image.data));
  }

  @Get('creation-steps/:stepId/image')
  @UseGuards(OptionalBearerAuthGuard)
  async getCreationStepImage(
    @Param('stepId') stepId: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const image = await this.images.getCreationStepImage(
      stepId,
      auth?.sub,
      auth?.role,
    );
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({
        isPublic: image.isPublic,
        kind: 'creation-step',
      }),
    );
    response.type(image.mimeType!);
    response.send(Buffer.from(image.data!));
  }
}
