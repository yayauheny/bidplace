import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './admin/admin.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { BidsModule } from './bids/bids.module';
import { DatabaseModule } from './core/database';
import { ApiExceptionFilter } from './core/errors';
import { HealthModule } from './core/health';
import { RealtimeModule } from './core/realtime';
import { ClockModule } from './core/time';
import { ImagesModule } from './images/images.module';
import { LotsModule } from './lots/lots.module';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
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
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
