import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AnalyticsModule } from './analytics/analytics.module';
import { AntifraudModule } from './antifraud';
import { AuthModule } from './auth/auth.module';
import { SocialAuthModule } from './auth/social-auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { CategoriesModule } from './categories/categories.module';
import { ServerEnvModule, type ServerEnv } from './core/config';
import { DatabaseModule } from './core/database';
import { MediaModule } from './core/media/media.module';
import { ImageStoreModule } from './core/image-store';
import { MailModule } from './core/mail';
import { ApiExceptionFilter } from './core/errors';
import { HealthModule } from './core/health';
import {
  RequestIdMiddleware,
  RequestLoggingInterceptor,
} from './core/request-context';
import { ClockModule } from './core/time';
import { TickModule } from './core/tick/tick.module';
import { PublicIdModule } from './core/public-id';
import { ProductsModule } from './products/products.module';
import { OtpModule } from './otp/otp.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ImagesModule } from './images/images.module';
import { SellersModule } from './sellers/sellers.module';
import { CommerceModule } from './commerce/commerce.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }

  static forRoot(env: ServerEnv): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ServerEnvModule.forRoot(env),
        HealthModule,
        ClockModule,
        TickModule,
        PublicIdModule,
        ImageStoreModule,
        MediaModule,
        MailModule,
        CategoriesModule,
        CatalogModule,
        DatabaseModule,
        AntifraudModule,
        AuthModule,
        SocialAuthModule,
        AnalyticsModule,
        ProductsModule,
        OtpModule,
        PasswordResetModule,
        AdminModule,
        NotificationsModule,
        ImagesModule,
        SellersModule,
        PortfolioModule,
        CommerceModule,
        FavoritesModule,
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
    };
  }
}
