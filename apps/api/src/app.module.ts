import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
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
    AdminModule,
    CategoriesModule,
    DatabaseModule,
    AuthModule,
    SellersModule,
    LotsModule,
    BidsModule,
    RealtimeModule,
    AuctionsModule,
  ],
})
export class AppModule {}
