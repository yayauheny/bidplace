import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../database';
import { ImageStore } from './image-store';
import { PostgresImageStore } from './postgres-image-store';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: ImageStore,
      useClass: PostgresImageStore,
    },
  ],
  exports: [ImageStore],
})
export class ImageStoreModule {}
