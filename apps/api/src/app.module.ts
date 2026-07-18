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
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
