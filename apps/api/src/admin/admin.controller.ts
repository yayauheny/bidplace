import {
  adminAuctionResponseSchema,
  adminAuctionsResponseSchema,
  adminUserResponseSchema,
  adminUsersResponseSchema,
} from '@bidplace/contracts';
import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';

import { BearerAuthGuard } from '../auth';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async listUsers() {
    return adminUsersResponseSchema.parse(await this.adminService.listUsers());
  }

  @Patch('users/:userId/ban')
  async banUser(@Param('userId') userId: string) {
    return adminUserResponseSchema.parse(await this.adminService.banUser(userId));
  }

  @Get('auctions')
  async listAuctions() {
    return adminAuctionsResponseSchema.parse(
      await this.adminService.listAuctions(),
    );
  }

  @Patch('auctions/:auctionId/hide')
  async hideAuction(@Param('auctionId') auctionId: string) {
    return adminAuctionResponseSchema.parse(
      await this.adminService.hideAuction(auctionId),
    );
  }

  @Get('auctions/:auctionId/bids')
  async listAuctionBids(@Param('auctionId') auctionId: string) {
    return this.adminService.listAuctionBids(auctionId);
  }
}
