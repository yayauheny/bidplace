import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database';
import { parseImageKey } from './image-key';
import {
  type ImageObject,
  type ImageStoreClient,
  ImageStore,
  RevisionMediaStorageError,
} from './image-store';

type ImageStoragePayload = {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
};

function storagePayload(object: ImageObject): ImageStoragePayload {
  return {
    data: Uint8Array.from(object.bytes) as Uint8Array<ArrayBuffer>,
    mimeType: object.mimeType,
  };
}

@Injectable()
export class PostgresImageStore extends ImageStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async put(
    key: string,
    object: ImageObject,
    client?: ImageStoreClient,
  ): Promise<void> {
    const db = client ?? this.prisma;
    const parsed = parseImageKey(key);
    const payload = storagePayload(object);

    switch (parsed.kind) {
      case 'product-image':
        await db.productImage.update({
          where: { id: parsed.id },
          data: payload,
        });
        return;
      case 'creation-step':
        await db.productCreationStep.update({
          where: { id: parsed.id },
          data: payload,
        });
        return;
      case 'seller-photo':
        await db.sellerProfile.update({
          where: { id: parsed.id },
          data: {
            profilePhotoMimeType: payload.mimeType,
            profilePhotoData: payload.data,
          },
        });
        return;
      case 'seller-profile-revision':
      case 'seller-achievement':
        throw new RevisionMediaStorageError();
    }
  }

  async get(key: string): Promise<ImageObject | null> {
    const parsed = parseImageKey(key);

    switch (parsed.kind) {
      case 'product-image': {
        const image = await this.prisma.productImage.findUnique({
          where: { id: parsed.id },
          select: { data: true, mimeType: true },
        });

        if (!image) {
          return null;
        }

        return {
          bytes: image.data,
          mimeType: image.mimeType,
        };
      }
      case 'creation-step': {
        const step = await this.prisma.productCreationStep.findUnique({
          where: { id: parsed.id },
          select: { data: true, mimeType: true },
        });

        if (!step?.data || !step.mimeType) {
          return null;
        }

        return {
          bytes: step.data,
          mimeType: step.mimeType,
        };
      }
      case 'seller-photo': {
        const profile = await this.prisma.sellerProfile.findUnique({
          where: { id: parsed.id },
          select: {
            profilePhotoData: true,
            profilePhotoMimeType: true,
          },
        });

        if (!profile) {
          return null;
        }

        return {
          bytes: profile.profilePhotoData,
          mimeType: profile.profilePhotoMimeType,
        };
      }
      case 'seller-profile-revision':
      case 'seller-achievement':
        return null;
    }
  }

  async delete(key: string, client?: ImageStoreClient): Promise<void> {
    const db = client ?? this.prisma;
    const parsed = parseImageKey(key);

    switch (parsed.kind) {
      case 'product-image':
      case 'seller-photo':
        return;
      case 'seller-profile-revision':
      case 'seller-achievement':
        throw new RevisionMediaStorageError();
      case 'creation-step':
        await db.productCreationStep.update({
          where: { id: parsed.id },
          data: {
            mimeType: null,
            byteLength: null,
            data: null,
            checksum: null,
            width: null,
            height: null,
          },
        });
        return;
    }
  }
}
