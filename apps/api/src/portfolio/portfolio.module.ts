import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module';
import { SellersModule } from '../sellers/sellers.module';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [ProductsModule, SellersModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
