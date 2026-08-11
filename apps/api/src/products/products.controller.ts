import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  productWriteRequestSchema,
  creationStepOrderRequestSchema,
  creationStoryWriteRequestSchema,
  publicDiscoveryQuerySchema,
} from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { parseBody } from '../core/validation';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.products.listPublic(
      parseBody(publicDiscoveryQuerySchema, query),
    );
  }

  @Get(':publicId')
  get(@Param('publicId') publicId: string) {
    return this.products.getPublic(publicId);
  }

  @Post()
  @UseGuards(BearerAuthGuard)
  create(@CurrentUser() auth: { sub: string }, @Body() body: unknown) {
    return this.products.create(
      auth.sub,
      parseBody(productWriteRequestSchema, body),
    );
  }

  @Post(':id/submit')
  @UseGuards(BearerAuthGuard)
  submit(@CurrentUser() auth: { sub: string }, @Param('id') id: string) {
    return this.products.submit(auth.sub, id);
  }

  @Patch(':id')
  @UseGuards(BearerAuthGuard)
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
  @UseGuards(BearerAuthGuard)
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
  @UseGuards(BearerAuthGuard)
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
