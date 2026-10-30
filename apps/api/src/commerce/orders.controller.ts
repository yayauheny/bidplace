import type { AuthPrincipal } from '@bidplace/contracts';
import {
  adminOrderOutcomeRequestSchema,
  adminOrderReasonRequestSchema,
  failOrderRequestSchema,
  orderDetailSchema,
  orderNoteRequestSchema,
  ordersListQuerySchema,
  ordersListResponseSchema,
} from '@bidplace/contracts';
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { CurrentUser, SessionAuthGuard, VerifiedEmailGuard } from '../auth';
import { parseBody, parseQuery } from '../core/validation';
import { OrdersService } from './orders.service';

const PUBLIC_ID = /^[A-Za-z0-9_-]{11}$/;

@Controller()
@UseGuards(SessionAuthGuard, VerifiedEmailGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('me/orders')
  @Header('Cache-Control', 'private, no-store')
  async list(@CurrentUser() auth: AuthPrincipal, @Query() query: unknown) {
    return ordersListResponseSchema.parse(
      await this.orders.list(auth.sub, parseQuery(ordersListQuerySchema, query)),
    );
  }

  @Get('orders/:publicId')
  @Header('Cache-Control', 'private, no-store')
  async get(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Query() query: Record<string, unknown>,
  ) {
    if (Object.prototype.hasOwnProperty.call(query, 'dealCode')) {
      throw new NotFoundException('Order not found');
    }
    return orderDetailSchema.parse(
      await this.orders.get(auth.sub, orderPublicId(publicId)),
    );
  }

  @Post('orders/:publicId/accept')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async accept(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
  ) {
    return orderDetailSchema.parse(
      await this.orders.accept(auth.sub, orderPublicId(publicId)),
    );
  }

  @Post('orders/:publicId/decline')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async decline(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
  ) {
    return orderDetailSchema.parse(
      await this.orders.decline(auth.sub, orderPublicId(publicId)),
    );
  }

  @Post('orders/:publicId/complete')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async complete(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
  ) {
    return orderDetailSchema.parse(
      await this.orders.complete(auth.sub, orderPublicId(publicId)),
    );
  }

  @Post('orders/:publicId/fail')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async fail(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return orderDetailSchema.parse(
      await this.orders.fail(
        auth.sub,
        orderPublicId(publicId),
        parseBody(failOrderRequestSchema, body),
      ),
    );
  }

  @Put('orders/:publicId/note')
  @Header('Cache-Control', 'private, no-store')
  async note(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    const input = parseBody(orderNoteRequestSchema, body);
    return orderDetailSchema.parse(
      await this.orders.note(auth.sub, orderPublicId(publicId), input.note),
    );
  }

  @Post('orders/:publicId/offer-next')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  async offerNext(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
  ) {
    return orderDetailSchema.parse(
      await this.orders.offerNext(auth.sub, orderPublicId(publicId)),
    );
  }

  @Post('admin/orders/:publicId/void-strike')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(AdminGuard)
  async voidStrike(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    const input = parseBody(adminOrderReasonRequestSchema, body);
    return orderDetailSchema.parse(
      await this.orders.voidStrike(auth.sub, orderPublicId(publicId), input.reason),
    );
  }

  @Post('admin/orders/:publicId/outcome')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'private, no-store')
  @UseGuards(AdminGuard)
  async outcome(
    @CurrentUser() auth: AuthPrincipal,
    @Param('publicId') publicId: string,
    @Body() body: unknown,
  ) {
    return orderDetailSchema.parse(
      await this.orders.adminOutcome(
        auth.sub,
        orderPublicId(publicId),
        parseBody(adminOrderOutcomeRequestSchema, body),
      ),
    );
  }
}

function orderPublicId(value: string): string {
  if (!PUBLIC_ID.test(value)) throw new NotFoundException('Order not found');
  return value;
}
