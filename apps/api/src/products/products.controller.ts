import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  productWriteRequestSchema,
  creationStepOrderRequestSchema,
  creationStoryWriteRequestSchema,
} from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser, VerifiedEmailGuard } from '../auth';
import { parseBody } from '../core/validation';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  create(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.products.create(
      auth.sub,
      parseBody(productWriteRequestSchema, body),
    );
  }

  @Post(':id/submit')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  submit(@CurrentUser() auth: { sub: string }, @Param('id') id: string) {
    return this.products.submit(auth.sub, id);
  }

  @Post(':id/hide')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  hide(@CurrentUser() auth: { sub: string }, @Param('id') id: string) {
    return this.products.hide(auth.sub, id);
  }

  @Post(':id/unhide')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  unhide(@CurrentUser() auth: { sub: string }, @Param('id') id: string) {
    return this.products.unhide(auth.sub, id);
  }

  @Patch(':id')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  update(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.products.update(
      auth.sub,
      id,
      parseBody(productWriteRequestSchema, body),
    );
  }

  @Put(':id/creation')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  replaceCreation(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.products.replaceCreationStory(
      auth.sub,
      id,
      parseBody(creationStoryWriteRequestSchema, body),
    );
  }

  @Patch(':id/creation/order')
  @UseGuards(BearerAuthGuard, VerifiedEmailGuard)
  reorderCreation(
    @CurrentUser() auth: { sub: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.products.reorderCreationSteps(
      auth.sub,
      id,
      parseBody(creationStepOrderRequestSchema, body).stepIds,
    );
  }
}
