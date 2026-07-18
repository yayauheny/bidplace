import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { ProductsModule } from '../products/products.module';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [AuthModule, DatabaseModule, ProductsModule],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
