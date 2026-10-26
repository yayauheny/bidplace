import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
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
  productImageOrderRequestSchema,
  workPhotoEditRequestSchema,
  uuidSchema,
} from '@bidplace/contracts';
import {
  SessionAuthGuard,
  CurrentUser,
  OptionalSessionAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import { parseBody } from '../core/validation';
import { RateLimit } from '../core/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../core/rate-limit/rate-limit.guard';
import {
  acceptSupportedUploadMimeType,
  getImageCacheControl,
  productImageUploadLimits,
  type RawImageUpload,
} from './image-policy';
import { WorkImageUploadInterceptor } from './work-image-upload.interceptor';
import { ImagesService } from './images.service';

@Controller()
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  @Post('products/:productId/images')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:product-upload',
    limit: 20,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(WorkImageUploadInterceptor)
  async add(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @UploadedFiles() files: RawImageUpload[] = [],
    @Headers('idempotency-key') idempotencyKey?: string,
    @Headers('x-photo-revision') expectedRevisionId?: string,
    @Headers('x-photo-response') responseVersion?: string,
  ) {
    if (!files.length)
      throw new BadRequestException('At least one image is required');
    const result = await this.images.add(
      auth.sub,
      productId,
      files,
      idempotencyKey,
      expectedRevisionId
        ? parseBody(uuidSchema, expectedRevisionId)
        : undefined,
    );
    if (!idempotencyKey || responseVersion !== 'slots') return result;
    const { photo } = await this.images.photoOperation(
      auth.sub,
      productId,
      idempotencyKey,
    );
    if (!photo) throw new Error('Accepted upload is missing its photo slot');
    return { ok: true as const, photos: [photo] };
  }

  @Get('products/:productId/image-operations/:operationKey')
  @UseGuards(SessionAuthGuard)
  photoOperation(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('operationKey') operationKey: string,
    @Query('slotId') slotId?: string,
  ) {
    return this.images.photoOperation(
      auth.sub,
      productId,
      operationKey,
      slotId ? parseBody(uuidSchema, slotId) : undefined,
    );
  }

  @Patch('products/:productId/photos/:slotId')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  editPhotoCrop(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('slotId', new ParseUUIDPipe({ version: '4' })) slotId: string,
    @Body() body: unknown,
  ) {
    return this.images.editPhoto(
      auth.sub,
      productId,
      slotId,
      parseBody(workPhotoEditRequestSchema, body),
    );
  }

  @Post('products/:productId/photos/:slotId')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:product-upload',
    limit: 20,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(WorkImageUploadInterceptor)
  replacePhoto(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Param('slotId', new ParseUUIDPipe({ version: '4' })) slotId: string,
    @Headers('idempotency-key') operationKey: string | undefined,
    @Body('data') data: string,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (!operationKey || files.length !== 1)
      throw new BadRequestException(
        'Replacement requires one image and an idempotency key',
      );
    let body: unknown;
    try {
      body = JSON.parse(data);
    } catch {
      throw new BadRequestException('Invalid photo metadata');
    }
    const request = parseBody(workPhotoEditRequestSchema, body);
    if (request.operationKey !== operationKey)
      throw new BadRequestException('Image operation keys do not match');
    return this.images.editPhoto(
      auth.sub,
      productId,
      slotId,
      request,
      files[0],
    );
  }

  @Post('products/:productId/story-images')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:story-upload',
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
  async addStoryImage(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @UploadedFiles() files: RawImageUpload[] = [],
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (files.length !== 1)
      throw new BadRequestException('An image is required');
    return this.images.addStoryImage(
      auth.sub,
      productId,
      files[0]!,
      idempotencyKey,
    );
  }

  @Delete('products/:productId/story-images/:assetId')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  removeStoryImage(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
  ) {
    return this.images.removeStoryImage(auth.sub, productId, assetId);
  }

  @Get('products/:productId/story-images/:assetId')
  @UseGuards(OptionalSessionAuthGuard)
  async getStoryImage(
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const image = await this.images.getStoryImage(
      productId,
      assetId,
      auth?.sub,
      auth?.role,
    );
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({ isPublic: image.isPublic, kind: 'product' }),
    );
    response.type(image.mimeType);
    response.send(Buffer.from(image.data));
  }

  @Post('products/:productId/creation-steps/:stepId/image')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard, RateLimitGuard)
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
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @Param('stepId', new ParseUUIDPipe({ version: '4' })) stepId: string,
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
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  remove(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @Param('imageId', new ParseUUIDPipe({ version: '4' })) imageId: string,
    @Query('revisionId') revisionId?: string,
  ) {
    return this.images.remove(
      auth.sub,
      productId,
      imageId,
      revisionId ? parseBody(uuidSchema, revisionId) : undefined,
    );
  }

  @Patch('products/:productId/images/order')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  reorder(
    @CurrentUser() auth: { sub: string },
    @Param('productId', new ParseUUIDPipe({ version: '4' }))
    productId: string,
    @Body() body: unknown,
  ) {
    const request = parseBody(productImageOrderRequestSchema, body);
    return this.images.reorder(
      auth.sub,
      productId,
      request.imageIds,
      request.revisionId,
    );
  }

  @Get('images/:id')
  @UseGuards(OptionalSessionAuthGuard)
  async get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Query('source') source: string | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    if (source !== undefined && source !== 'true')
      throw new BadRequestException('Invalid image source option');
    const image = await this.images.get(
      id,
      auth?.sub,
      auth?.role,
      source === 'true',
    );
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({ isPublic: image.isPublic, kind: 'product' }),
    );
    response.type(image.mimeType);
    response.send(Buffer.from(image.data));
  }

  @Get('creation-steps/:stepId/image')
  @UseGuards(OptionalSessionAuthGuard)
  async getCreationStepImage(
    @Param('stepId', new ParseUUIDPipe({ version: '4' })) stepId: string,
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
