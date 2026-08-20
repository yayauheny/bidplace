import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { DatabaseModule } from './core/database';
import { ApiExceptionFilter } from './core/errors';
import { HealthModule } from './core/health';
import {
  RequestIdMiddleware,
  RequestLoggingInterceptor,
} from './core/request-context';
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
import { DiscoveryModule } from './discovery/discovery.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HealthModule,
    ClockModule,
    PublicIdModule,
    CategoriesModule,
    DatabaseModule,
    AuthModule,
    AnalyticsModule,
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
    DiscoveryModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
