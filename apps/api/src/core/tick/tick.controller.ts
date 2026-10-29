import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { InternalTickGuard } from './internal-tick.guard';
import { TickService, type TickResult } from './tick.service';

@Controller('internal/tick')
@UseGuards(InternalTickGuard)
export class TickController {
  constructor(private readonly tick: TickService) {}

  @Post()
  @HttpCode(200)
  run(): Promise<TickResult> {
    return this.tick.run();
  }
}
