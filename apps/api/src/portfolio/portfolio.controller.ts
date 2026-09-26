import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  portfolioAuthorsQuerySchema,
  portfolioCabinetWorksQuerySchema,
  portfolioAchievementWriteRequestSchema,
  portfolioWorksQuerySchema,
} from '@bidplace/contracts';

import { parseBody } from '../core/validation';
import {
  BearerAuthGuard,
  CurrentUser,
  OptionalBearerAuthGuard,
  VerifiedEmailGuard,
} from '../auth';
import { RateLimit, RateLimitGuard } from '../core/rate-limit';
import {
  acceptSupportedUploadMimeType,
  getImageCacheControl,
  productImageUploadLimits,
  type RawImageUpload,
  validateProductImageUploads,
} from '../images/image-policy';
import { PortfolioService } from './portfolio.service';

@Controller()
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('portfolio/home')
  home() {
    return this.portfolio.home();
  }

  @Get('portfolio/facets')
  facets() {
    return this.portfolio.facets();
  }

  @Get('works')
  listWorks(@Query() query: unknown) {
    return this.portfolio.listWorks(
      parseBody(portfolioWorksQuerySchema, query),
    );
  }

  @Get('works/:publicId')
  getWork(@Param('publicId') publicId: string) {
    return this.portfolio.getWork(publicId);
  }

  @Get('authors')
  listAuthors(@Query() query: unknown) {
    return this.portfolio.listAuthors(
      parseBody(portfolioAuthorsQuerySchema, query),
    );
  }

  @Get('authors/:slug')
  getAuthor(@Param('slug') slug: string, @Query() query: unknown) {
    return this.portfolio.getAuthor(
      slug,
      parseBody(portfolioWorksQuerySchema, query),
    );
  }

  @Get('author/application')
  @UseGuards(BearerAuthGuard)
  application(@CurrentUser() auth: { sub: string }) {
    return this.portfolio.getApplication(auth.sub);
  }

  @Post('author/application/submit')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  submitApplication(@CurrentUser() auth: { sub: string }) {
    return this.portfolio.submitApplication(auth.sub);
  }

  @Post('author/application/advance')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  advanceApplication(@CurrentUser() auth: { sub: string }) {
    return this.portfolio.advanceApplication(auth.sub);
  }

  @Get('author/application/photo')
  @UseGuards(BearerAuthGuard)
  async getApplicationPhoto(
    @CurrentUser() auth: { sub: string },
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const photo = await this.portfolio.getApplicationPhoto(auth.sub);
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({ isPublic: false, kind: 'seller-photo' }),
    );
    response.type(photo.mimeType);
    response.send(Buffer.from(photo.data));
  }

  @Post('author/application/achievements')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:achievement-upload',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  @UseInterceptors(
    FilesInterceptor('image', 1, {
      limits: { fileSize: productImageUploadLimits.maxFileBytes, files: 1 },
      fileFilter: (_request, file, done) =>
        acceptSupportedUploadMimeType(file.mimetype, done),
    }),
  )
  async addAchievement(
    @CurrentUser() auth: { sub: string },
    @Body() body: unknown,
    @UploadedFiles() files: RawImageUpload[] = [],
  ) {
    if (files.length > 1) {
      throw new BadRequestException('Only one achievement image is allowed');
    }
    return this.portfolio.addAchievement(
      auth.sub,
      parseBody(portfolioAchievementWriteRequestSchema, body),
      files.length ? (await validateProductImageUploads(files))[0] : undefined,
    );
  }

  @Delete('author/application/achievements/:id')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard, RateLimitGuard)
  @RateLimit({
    keyPrefix: 'images:achievement-delete',
    limit: 10,
    windowMs: 60_000,
    scope: 'user',
  })
  deleteAchievement(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
  ) {
    return this.portfolio.deleteAchievement(auth.sub, id);
  }

  @Get('author-achievements/:id/image')
  @UseGuards(OptionalBearerAuthGuard)
  async getAchievementImage(
    @Param('id') id: string,
    @CurrentUser() auth: { sub: string; role: string } | undefined,
    @Res()
    response: {
      setHeader(name: string, value: string): void;
      type(value: string): void;
      send(value: Buffer): void;
    },
  ) {
    const image = await this.portfolio.getAchievementImage(
      id,
      auth?.sub,
      auth?.role,
    );
    response.setHeader(
      'Cache-Control',
      getImageCacheControl({ isPublic: image.isPublic, kind: 'seller-photo' }),
    );
    response.type(image.mimeType);
    response.send(Buffer.from(image.data));
  }

  @Get('author/cabinet/works')
  @UseGuards(BearerAuthGuard)
  cabinetWorks(@CurrentUser() auth: { sub: string }, @Query() query: unknown) {
    return this.portfolio.listCabinetWorks(
      auth.sub,
      parseBody(portfolioCabinetWorksQuerySchema, query),
    );
  }
}
