import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { OrdersModule } from '../orders/orders.module';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';
import { AdminModerationService } from './admin-moderation.service';

@Module({
  imports: [AuthModule, DatabaseModule, OrdersModule],
  controllers: [AdminController],
  providers: [AdminGuard, AdminModerationService],
})
export class AdminModule {}
