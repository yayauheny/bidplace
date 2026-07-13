import { Module } from '@nestjs/common';

import { LotsController } from './lots.controller';
import { LotsService } from './lots.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';
import { StorageModule } from '../core/storage';

@Module({
  imports: [AuthModule, DatabaseModule, RateLimitModule, StorageModule],
  controllers: [LotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
