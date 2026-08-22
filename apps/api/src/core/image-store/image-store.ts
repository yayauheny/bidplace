import type { Prisma } from '@bidplace/database';

import type { PrismaService } from '../database/prisma.service';

export type ImageObject = {
  bytes: Uint8Array;
  mimeType: string;
};

export type ImageStoreClient = Prisma.TransactionClient | PrismaService;

export const emptyImageBytes = new Uint8Array(0) as Uint8Array<ArrayBuffer>;

export abstract class ImageStore {
  abstract put(
    key: string,
    object: ImageObject,
    client?: ImageStoreClient,
  ): Promise<void>;

  abstract get(key: string): Promise<ImageObject | null>;

  abstract delete(key: string, client?: ImageStoreClient): Promise<void>;
}
