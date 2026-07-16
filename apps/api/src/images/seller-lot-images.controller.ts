import {
  lotImageReorderRequestSchema,
  lotResponseSchema,
  type AuthTokenPayload,
  uuidSchema,
} from '@bidplace/contracts';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { parseBody } from '../core/validation';
import { ImagesService } from './images.service';

function parseUuidParam(paramName: string, value: string): string {
  const result = uuidSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(`${paramName} must be a valid UUID`);
  }

  return result.data;
}

@Controller('seller/lots/:lotId/images')
@UseGuards(BearerAuthGuard)
export class SellerLotImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Delete(':imageId')
  async deleteLotImage(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('lotId') lotId: string,
    @Param('imageId') imageId: string,
  ) {
    return lotResponseSchema.parse(
      await this.imagesService.deleteLotImage(
        auth,
        parseUuidParam('lotId', lotId),
        parseUuidParam('imageId', imageId),
      ),
    );
  }

  @Patch('reorder')
  async reorderLotImages(
    @CurrentUser() auth: AuthTokenPayload,
    @Param('lotId') lotId: string,
    @Body() body: unknown,
  ) {
    return lotResponseSchema.parse(
      await this.imagesService.reorderLotImages(
        auth,
        parseUuidParam('lotId', lotId),
        parseBody(lotImageReorderRequestSchema, body),
      ),
    );
  }
}
