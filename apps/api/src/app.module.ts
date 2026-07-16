import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './admin/admin.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { BidsModule } from './bids/bids.module';
import { DatabaseModule } from './core/database';
import { HealthModule } from './core/health';
import { LoggerModule } from './core/logger';
import { RealtimeModule } from './core/realtime';
import { ClockModule } from './core/time';
import { ImagesModule } from './images/images.module';
import { LotsModule } from './lots/lots.module';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    LoggerModule,
    ClockModule,
    AdminModule,
    CategoriesModule,
    DatabaseModule,
    AuthModule,
    SellersModule,
    LotsModule,
    ImagesModule,
    BidsModule,
    RealtimeModule,
    AuctionsModule,
  ],
})
export class AppModule {}
