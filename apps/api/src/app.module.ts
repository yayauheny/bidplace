import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [HealthModule, LoggerModule, DatabaseModule, AuthModule, SellersModule],
})
export class AppModule {}
