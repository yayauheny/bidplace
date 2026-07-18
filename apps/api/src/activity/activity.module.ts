import { Module } from '@nestjs/common'; import { AuthModule } from '../auth'; import { DatabaseModule } from '../core/database'; import { ActivityController } from './activity.controller'; import { ActivityService } from './activity.service';
@Module({ imports: [AuthModule, DatabaseModule], controllers: [ActivityController], providers: [ActivityService] }) export class ActivityModule {}
