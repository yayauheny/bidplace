import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { RateLimitModule } from '../core/rate-limit';
import { ProductsModule } from '../products/products.module';
import { SellersModule } from '../sellers/sellers.module';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';

@Module({
  imports: [AuthModule, RateLimitModule, ProductsModule, SellersModule],
  controllers: [PortfolioController],
  providers: [PortfolioService],
})
export class PortfolioModule {}
