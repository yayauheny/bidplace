import { Module } from '@nestjs/common';

import { AdminGuard } from '../admin/admin.guard';
import { AuthModule } from '../auth';
import { NotificationAdminController } from './notification-admin.controller';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationSettingsController } from './notification-settings.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationSettingsController, NotificationAdminController],
  providers: [NotificationDeliveryService, AdminGuard],
  exports: [NotificationDeliveryService],
})
export class NotificationsModule {}
