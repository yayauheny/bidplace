import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '../database';
import { parseImageKey } from './image-key';
import {
  type ImageObject,
  type ImageStoreClient,
  ImageStore,
} from './image-store';

type ImageStoragePayload = {
  data: Uint8Array<ArrayBuffer>;
  mimeType: string;
  byteLength: number;
  checksum: string;
};

function storagePayload(object: ImageObject): ImageStoragePayload {
  const data = Uint8Array.from(object.bytes) as Uint8Array<ArrayBuffer>;
  return {
    data,
    mimeType: object.mimeType,
    byteLength: data.byteLength,
    checksum: createHash('sha256').update(data).digest('hex'),
  };
}

function storedObject(
  data: Uint8Array | null | undefined,
  mimeType: string | null | undefined,
): ImageObject | null {
  if (!data?.byteLength || !mimeType) {
    return null;
  }
  return { bytes: data, mimeType };
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
          data: {
            data: payload.data,
            mimeType: payload.mimeType,
          },
        });
        return;
      case 'creation-step':
        await db.productCreationStep.update({
          where: { id: parsed.id },
          data: {
            data: payload.data,
            mimeType: payload.mimeType,
          },
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
        await db.sellerProfileRevision.update({
          where: { id: parsed.id },
          data: {
            profilePhotoMimeType: payload.mimeType,
            profilePhotoByteLength: payload.byteLength,
            profilePhotoChecksum: payload.checksum,
            profilePhotoData: payload.data,
          },
        });
        return;
      case 'seller-achievement':
        await db.sellerProfileRevisionAchievement.update({
          where: { id: parsed.id },
          data: {
            mimeType: payload.mimeType,
            byteLength: payload.byteLength,
            checksum: payload.checksum,
            data: payload.data,
          },
        });
        return;
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
        return storedObject(image?.data, image?.mimeType);
      }
      case 'creation-step': {
        const step = await this.prisma.productCreationStep.findUnique({
          where: { id: parsed.id },
          select: { data: true, mimeType: true },
        });
        return storedObject(step?.data, step?.mimeType);
      }
      case 'seller-photo': {
        const profile = await this.prisma.sellerProfile.findUnique({
          where: { id: parsed.id },
          select: {
            profilePhotoData: true,
            profilePhotoMimeType: true,
          },
        });
        return storedObject(
          profile?.profilePhotoData,
          profile?.profilePhotoMimeType,
        );
      }
      case 'seller-profile-revision': {
        const revision = await this.prisma.sellerProfileRevision.findUnique({
          where: { id: parsed.id },
          select: {
            profilePhotoData: true,
            profilePhotoMimeType: true,
          },
        });
        return storedObject(
          revision?.profilePhotoData,
          revision?.profilePhotoMimeType,
        );
      }
      case 'seller-achievement': {
        const achievement =
          await this.prisma.sellerProfileRevisionAchievement.findUnique({
            where: { id: parsed.id },
            select: { data: true, mimeType: true },
          });
        return storedObject(achievement?.data, achievement?.mimeType);
      }
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
        await db.sellerProfileRevision.update({
          where: { id: parsed.id },
          data: {
            profilePhotoMimeType: null,
            profilePhotoByteLength: null,
            profilePhotoChecksum: null,
            profilePhotoData: null,
          },
        });
        return;
      case 'seller-achievement': {
        const achievement =
          await db.sellerProfileRevisionAchievement.findUnique({
            where: { id: parsed.id },
            select: { id: true },
          });
        if (!achievement) {
          return;
        }
        await db.sellerProfileRevisionAchievement.update({
          where: { id: parsed.id },
          data: {
            mimeType: null,
            byteLength: null,
            checksum: null,
            data: null,
          },
        });
        return;
      }
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
