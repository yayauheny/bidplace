import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  portfolioAuthorsQuerySchema,
  portfolioAchievementWriteRequestSchema,
  portfolioWorksQuerySchema,
} from '@bidplace/contracts';

import { parseBody } from '../core/validation';
import { BearerAuthGuard, CurrentUser } from '../auth';
import { PortfolioService } from './portfolio.service';

@Controller()
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('portfolio/home')
  home() {
    return this.portfolio.home();
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
  @UseGuards(BearerAuthGuard)
  submitApplication(@CurrentUser() auth: { sub: string }) {
    return this.portfolio.submitApplication(auth.sub);
  }

  @Post('author/application/achievements')
  @UseGuards(BearerAuthGuard)
  addAchievement(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.portfolio.addAchievement(
      auth.sub,
      parseBody(portfolioAchievementWriteRequestSchema, body),
    );
  }

  @Get('author/cabinet/works')
  @UseGuards(BearerAuthGuard)
  cabinetWorks(@CurrentUser() auth: { sub: string }) {
    return this.portfolio.listCabinetWorks(auth.sub);
  }
}
