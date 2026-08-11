import { Controller, Get } from '@nestjs/common';

import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Get('home')
  home() {
    return this.discovery.home();
  }
}
