import { Global, Module } from '@nestjs/common';

import { DatabaseModule, PrismaService } from '../database';
import { ImageStore } from './image-store';
import { PostgresImageStore } from './postgres-image-store';
import { S3ImageStore } from './s3-image-store';
import { loadServerEnv } from '../config/env';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: ImageStore,
      useFactory: (prisma: PrismaService) =>
        loadServerEnv().MEDIA_STORAGE_PROVIDER === 's3'
          ? new S3ImageStore()
          : new PostgresImageStore(prisma),
      inject: [PrismaService],
    },
  ],
  exports: [ImageStore],
})
export class ImageStoreModule {}
