import { Module } from '@nestjs/common';

import { SellerProfileController } from './seller-profile.controller';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [SellerProfileController, SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
