import { type AuthTokenPayload, uuidSchema } from '@bidplace/contracts';
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, OptionalBearerAuthGuard } from '../auth';
import { getImageCacheControl } from './image-policy';
import { ImagesService } from './images.service';

type ImageResponseWriter = {
  setHeader(name: string, value: string): void;
  status(code: number): ImageResponseWriter;
};

function parseUuidParam(paramName: string, value: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(`${paramName} must be a valid UUID`);
  }

  return result.data;
}

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':imageId')
  @UseGuards(OptionalBearerAuthGuard)
  async getImage(
    @Param('imageId') imageId: string,
    @CurrentUser() auth: AuthTokenPayload | undefined,
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res({ passthrough: true }) response: ImageResponseWriter,
  ) {
    const image = await this.imagesService.getImage(
      parseUuidParam('imageId', imageId),
      auth,
    );
    const etag = `"${image.checksum}"`;

    if (ifNoneMatch?.split(',').map((value) => value.trim()).includes(etag)) {
      response.status(304);
      return;
    }

    response.setHeader('Content-Type', image.mimeType);
    response.setHeader('Content-Length', String(image.byteLength));
    response.setHeader('ETag', etag);
    response.setHeader('Cache-Control', getImageCacheControl(image.isPublic));
    response.setHeader('X-Content-Type-Options', 'nosniff');

    return image.data;
  }
}
