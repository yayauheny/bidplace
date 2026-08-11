import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { SellersModule } from '../sellers/sellers.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [ProductsModule, SellersModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
