import { Module } from '@nestjs/common';

import { CommerceCapabilityModule } from '../core/commerce';
import { ProductsModule } from '../products/products.module';
import { SellersModule } from '../sellers/sellers.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  imports: [CommerceCapabilityModule, ProductsModule, SellersModule],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
