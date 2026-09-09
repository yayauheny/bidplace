import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CommerceCapabilityModule } from '../core/commerce';
import { DatabaseModule } from '../core/database';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [AuthModule, CommerceCapabilityModule, DatabaseModule],
  controllers: [ActivityController],
  providers: [ActivityService],
})
export class ActivityModule {}
