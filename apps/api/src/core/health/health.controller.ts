import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';

import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth() {
    return this.healthService.getStatus();
  }

  @Get('health/ready')
  async getReady() {
    const ready = await this.healthService.getReadyStatus();

    if (ready.status !== 'ok') {
      throw new ServiceUnavailableException(ready);
    }

    return ready;
  }
}
