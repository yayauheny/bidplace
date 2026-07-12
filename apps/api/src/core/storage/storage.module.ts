import { Module } from '@nestjs/common';

import { FileStorageService } from './file-storage.service';
import { LocalFileStorageService } from './local-file-storage.service';

@Module({
  providers: [
    {
      provide: FileStorageService,
      useFactory: () => new LocalFileStorageService(),
    },
  ],
  exports: [FileStorageService],
})
export class StorageModule {}
