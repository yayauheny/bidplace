import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { CommerceCapabilityModule } from '../core/commerce';
import { DatabaseModule } from '../core/database';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, CommerceCapabilityModule, DatabaseModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
