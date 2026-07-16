import { Module } from '@nestjs/common';

import { LotsController } from './lots.controller';
import { SellerLotsController } from './seller-lots.controller';
import { LotsService } from './lots.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';
import { RateLimitModule } from '../core/rate-limit';

@Module({
  imports: [AuthModule, DatabaseModule, RateLimitModule],
  controllers: [LotsController, SellerLotsController],
  providers: [LotsService],
  exports: [LotsService],
})
export class LotsModule {}
