import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { ImageStoreModule } from '../core/image-store';
import { RateLimitModule } from '../core/rate-limit';
import { ProductsModule } from '../products/products.module';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    ImageStoreModule,
    ProductsModule,
    RateLimitModule,
  ],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
