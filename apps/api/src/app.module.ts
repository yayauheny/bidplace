import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './core/database';
import { ApiExceptionFilter } from './core/errors';
import { HealthModule } from './core/health';
import { ClockModule } from './core/time';
import { PublicIdModule } from './core/public-id';
import { ProductsModule } from './products/products.module';
import { ListingsModule } from './listings/listings.module';
import { BidsModule } from './bids/bids.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { OrdersModule } from './orders/orders.module';
import { OtpModule } from './otp/otp.module';
import { AdminModule } from './admin/admin.module';
import { ActivityModule } from './activity/activity.module';
import { ImagesModule } from './images/images.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SellersModule } from './sellers/sellers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    ClockModule,
    PublicIdModule,
    CategoriesModule,
    DatabaseModule,
    AuthModule,
    ProductsModule,
    ListingsModule,
    BidsModule,
    LifecycleModule,
    OrdersModule,
    OtpModule,
    AdminModule,
    ActivityModule,
    ImagesModule,
    RealtimeModule,
    SellersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
