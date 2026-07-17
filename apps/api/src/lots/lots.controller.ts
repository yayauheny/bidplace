import {
  lotCreateRequestSchema,
  lotResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import {
  Body,
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { CurrentUser, BearerAuthGuard } from '../auth';
import { LotsService } from './lots.service';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import {
  lotImageUploadLimits,
  supportedImageMimeTypes,
  type RawImageUpload,
  validateLotImageUploads,
} from '../images/image-policy';

function imageFileFilter(
  _request: unknown,
  file: { mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (
    file.mimetype &&
    !supportedImageMimeTypes.some((mimeType) => mimeType === file.mimetype)
  ) {
    callback(new BadRequestException('Unsupported image type'), false);
    return;
  }

  callback(null, true);
}

@Controller('lots')
@UseGuards(BearerAuthGuard)
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({
    keyPrefix: 'lots:create',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('images', lotImageUploadLimits.maxFiles, {
      limits: {
        files: lotImageUploadLimits.maxFiles,
        fileSize: lotImageUploadLimits.maxFileBytes,
        parts: lotImageUploadLimits.maxFiles + 10,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async createLot(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
    @UploadedFiles()
    files: RawImageUpload[] = [],
  ) {
    const input = parseBody(lotCreateRequestSchema, body);
    const lot = await this.lotsService.createLot(
      auth.sub,
      input,
      await validateLotImageUploads(files),
    );

    return lotResponseSchema.parse(lot);
  }
}
