import {
  lotCreateRequestSchema,
  lotResponseSchema,
  type AuthTokenPayload,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { CurrentUser, BearerAuthGuard } from '../auth';
import { LotsService } from './lots.service';
import { FileStorageService } from '../core/storage';
import { parseBody } from '../core/validation';

@Controller('lots')
@UseGuards(BearerAuthGuard)
export class LotsController {
  constructor(
    private readonly lotsService: LotsService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images', 8))
  async createLot(
    @CurrentUser() auth: AuthTokenPayload,
    @Body() body: unknown,
    @UploadedFiles() files: Array<{ buffer: Buffer; originalname: string }> = [],
  ) {
    const storedImages = await this.fileStorageService.storeImages(files);
    const lot = await this.lotsService.createLot(
      auth.sub,
      parseBody(lotCreateRequestSchema, body),
      storedImages,
    );

    return lotResponseSchema.parse(lot);
  }
}
