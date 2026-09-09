import { Controller, Get, UseGuards } from '@nestjs/common';

import { CommerceEnabledGuard } from '../core/commerce';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('home')
  @UseGuards(CommerceEnabledGuard)
  home() {
    return this.discovery.home();
  }
}
