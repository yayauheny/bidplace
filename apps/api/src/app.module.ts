import { Module } from '@nestjs/common';

import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { BidsModule } from './bids/bids.module';
import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';
import { RealtimeModule } from './core/realtime';
import { LotsModule } from './lots/lots.module';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [
    HealthModule,
    LoggerModule,
    BidsModule,
    RealtimeModule,
    DatabaseModule,
    AuthModule,
    SellersModule,
    LotsModule,
    AuctionsModule,
  ],
})
export class AppModule {}
