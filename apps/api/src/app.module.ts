import { Module } from '@nestjs/common';

import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';

@Module({
  imports: [HealthModule, LoggerModule, DatabaseModule],
})
export class AppModule {}
