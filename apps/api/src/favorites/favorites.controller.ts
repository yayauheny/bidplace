import type { AuthPrincipal } from '@bidplace/contracts';
import {
  paginationQuerySchema,
  portfolioWorksResponseSchema,
} from '@bidplace/contracts';
import {
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser, SessionAuthGuard, VerifiedEmailGuard } from '../auth';
import { parseQuery } from '../core/validation';
import { FavoritesService } from './favorites.service';

@Controller()
@UseGuards(SessionAuthGuard, VerifiedEmailGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get('me/favorites')
  @Header('Cache-Control', 'private, no-store')
  async list(@CurrentUser() auth: AuthPrincipal, @Query() query: unknown) {
    return portfolioWorksResponseSchema.parse(
      await this.favorites.list(
        auth.sub,
        parseQuery(paginationQuerySchema, query),
      ),
    );
  }

  @Put('works/:productId/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'private, no-store')
  add(
    @CurrentUser() auth: AuthPrincipal,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ) {
    return this.favorites.add(auth.sub, productId);
  }

  @Delete('works/:productId/favorite')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'private, no-store')
  remove(
    @CurrentUser() auth: AuthPrincipal,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ) {
    return this.favorites.remove(auth.sub, productId);
  }
}
