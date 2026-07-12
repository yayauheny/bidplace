import { Module } from '@nestjs/common';

import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';
import { LotsModule } from './lots/lots.module';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [
    HealthModule,
    LoggerModule,
    DatabaseModule,
    AuthModule,
    SellersModule,
    LotsModule,
    AuctionsModule,
  ],
})
export class AppModule {}
