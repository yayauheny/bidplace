import {
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
  paginationQuerySchema,
} from '@bidplace/contracts';
import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { BearerAuthGuard } from '../auth';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { parseQuery } from '../core/validation';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers(@Query() query: unknown) {
    return adminUsersResponseSchema.parse(
      await this.adminService.listUsers(parseQuery(paginationQuerySchema, query)),
    );
  }

  @Patch('users/:userId/ban')
  async banUser(@Param('userId') userId: string) {
    return adminUserResponseSchema.parse(await this.adminService.banUser(userId));
  }

  @Get('auctions')
  async listAuctions(@Query() query: unknown) {
    return adminAuctionsResponseSchema.parse(
      await this.adminService.listAuctions(parseQuery(paginationQuerySchema, query)),
    );
  }

  @Patch('auctions/:auctionId/hide')
  async hideAuction(@Param('auctionId') auctionId: string) {
    return adminAuctionResponseSchema.parse(
      await this.adminService.hideAuction(auctionId),
    );
  }

  @Get('auctions/:auctionId/bids')
  async listAuctionBids(@Param('auctionId') auctionId: string, @Query() query: unknown) {
    return this.adminService.listAuctionBids(
      auctionId,
      parseQuery(paginationQuerySchema, query),
    );
  }
}
