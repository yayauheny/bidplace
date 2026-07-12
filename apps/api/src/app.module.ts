import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';

@Module({
  imports: [HealthModule, LoggerModule, DatabaseModule, AuthModule],
})
export class AppModule {}
