import { Global, Module } from '@nestjs/common';
import { SERVER_ENV, type ServerEnv } from '../config';
import { DatabaseModule } from '../database';
import { MediaLifecycleService } from './media-lifecycle.service';
import { MediaObjectStore, S3MediaObjectStore } from './media-object-store';
import {
  CloudflarePublicMediaCache,
  PublicMediaCache,
} from './public-media-cache';
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    MediaLifecycleService,
    {
      provide: MediaObjectStore,
      useFactory: (env: ServerEnv) =>
        env.S3_PUBLIC_BUCKET ? new S3MediaObjectStore(env) : null,
      inject: [SERVER_ENV],
    },
    {
      provide: PublicMediaCache,
      useFactory: (env: ServerEnv) => new CloudflarePublicMediaCache(env),
      inject: [SERVER_ENV],
    },
  ],
  exports: [MediaLifecycleService],
})
export class MediaModule {}
