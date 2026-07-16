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
import { LotsService, type LotImageUpload } from './lots.service';
import { parseBody } from '../core/validation';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function imageFileFilter(
  _request: unknown,
  file: { mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype || !allowedImageMimeTypes.has(file.mimetype)) {
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
    FilesInterceptor('images', 8, {
      limits: {
        files: 8,
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async createLot(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
    @UploadedFiles()
    files: LotImageUpload[] = [],
  ) {
    const input = parseBody(lotCreateRequestSchema, body);
    const lot = await this.lotsService.createLot(auth.sub, input, files);

    return lotResponseSchema.parse(lot);
  }
}
