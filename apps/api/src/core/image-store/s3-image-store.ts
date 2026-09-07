import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { loadServerEnv } from '../config/env';
import type { ImageObject } from './image-store';
import { ImageStore } from './image-store';

@Injectable()
export class S3ImageStore extends ImageStore {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor() {
    super();
    const env = loadServerEnv();
    if (
      env.MEDIA_STORAGE_PROVIDER !== 's3' ||
      !env.S3_ENDPOINT ||
      !env.S3_REGION ||
      !env.S3_BUCKET ||
      !env.S3_ACCESS_KEY_ID ||
      !env.S3_SECRET_ACCESS_KEY
    ) {
      throw new Error('S3 image storage is not configured');
    }

    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async put(key: string, object: ImageObject): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: object.bytes,
        ContentType: object.mimeType,
      }),
    );
  }

  async get(key: string): Promise<ImageObject | null> {
    let response;
    try {
      response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error.name === 'NoSuchKey' || error.name === 'NotFound')
      ) {
        return null;
      }
      throw error;
    }
    if (!response.Body) return null;

    return {
      bytes: await response.Body.transformToByteArray(),
      mimeType: response.ContentType ?? 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
