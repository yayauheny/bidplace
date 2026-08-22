import { Module } from '@nestjs/common';

import { AuthModule } from '../auth';
import { DatabaseModule } from '../core/database';
import { ImageStoreModule } from '../core/image-store';
import { RateLimitModule } from '../core/rate-limit';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';

@Module({
  imports: [AuthModule, DatabaseModule, ImageStoreModule, RateLimitModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
