import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../core/database';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { SellerLotImagesController } from './seller-lot-images.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ImagesController, SellerLotImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
