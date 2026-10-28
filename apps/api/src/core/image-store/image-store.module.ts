import { Global, Module } from '@nestjs/common';

import { SERVER_ENV, type ServerEnv } from '../config';
import { DatabaseModule, PrismaService } from '../database';
import { ImageStore } from './image-store';
import { PostgresImageStore } from './postgres-image-store';
import { S3ImageStore } from './s3-image-store';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: ImageStore,
      useFactory: (env: ServerEnv, prisma: PrismaService) =>
        env.MEDIA_STORAGE_PROVIDER === 's3'
          ? new S3ImageStore(env)
          : new PostgresImageStore(prisma),
      inject: [SERVER_ENV, PrismaService],
    },
  ],
  exports: [ImageStore],
})
export class ImageStoreModule {}
