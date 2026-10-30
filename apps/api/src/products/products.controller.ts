import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  productWriteRequestSchema,
  storyWriteRequestSchema,
} from '@bidplace/contracts';

import { SessionAuthGuard, CurrentUser, VerifiedEmailGuard } from '../auth';
import { parseBody } from '../core/validation';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(SessionAuthGuard)
  remove(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.products.remove(auth.sub, id);
  }

  @Post()
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  create(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.products.create(
      auth.sub,
      parseBody(productWriteRequestSchema, body),
    );
  }

  @Post(':id/submit')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  submit(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.products.submit(auth.sub, id);
  }

  @Post(':id/hide')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  hide(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.products.hide(auth.sub, id);
  }

  @Post(':id/unhide')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  unhide(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.products.unhide(auth.sub, id);
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  update(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.products.update(
      auth.sub,
      id,
      parseBody(productWriteRequestSchema, body),
    );
  }

  @Put(':id/creation')
  @UseGuards(SessionAuthGuard, VerifiedEmailGuard)
  replaceCreation(
    @CurrentUser() auth: { sub: string },
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
  ) {
    return this.products.replaceCreationStory(
      auth.sub,
      id,
      parseBody(storyWriteRequestSchema, body),
    );
  }
}
