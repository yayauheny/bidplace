import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { paginationQuerySchema } from '@bidplace/contracts';

import { BearerAuthGuard, CurrentUser } from '../auth';
import { parseQuery } from '../core/validation';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(BearerAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(
    @CurrentUser() auth: { sub: string; role: string },
    @Query() query: unknown,
  ) {
    return this.orders.listForSeller(
      auth.sub,
      auth.role,
      parseQuery(paginationQuerySchema, query),
    );
  }

  @Get(':publicId')
  get(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
  ) {
    return this.orders.get(auth.sub, auth.role, publicId);
  }

  @Post(':publicId/contacted')
  contacted(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
  ) {
    return this.orders.markContacted(auth.sub, auth.role, publicId);
  }

  @Post(':publicId/completed')
  completed(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
  ) {
    return this.orders.markCompleted(auth.sub, auth.role, publicId);
  }

  @Post(':publicId/handoff-failed')
  handoffFailed(
    @CurrentUser() auth: { sub: string; role: string },
    @Param('publicId') publicId: string,
  ) {
    return this.orders.markHandoffFailed(auth.sub, auth.role, publicId);
  }
}
