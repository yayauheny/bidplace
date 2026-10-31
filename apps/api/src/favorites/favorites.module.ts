import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { ProductsModule } from '../products/products.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [AuthModule, ProductsModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
