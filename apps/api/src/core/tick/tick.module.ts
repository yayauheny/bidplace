import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ClockModule } from '../time';
import { InternalTickGuard } from './internal-tick.guard';
import { TickController } from './tick.controller';
import { TickService } from './tick.service';

@Global()
@Module({
  imports: [DatabaseModule, ClockModule],
  controllers: [TickController],
  providers: [TickService, InternalTickGuard],
  exports: [TickService],
})
export class TickModule {}
