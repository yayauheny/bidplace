import { createHash } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { MediaTier } from '@bidplace/database';
import type { ServerEnv } from '../config';

export type StoredMedia = { bytes: Uint8Array; mimeType: string };
export type MediaIdentity = {
  sha256: string;
  byteLength: number;
  mimeType: string;
};
export function mediaChecksum(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}
export abstract class MediaObjectStore {
  abstract get(tier: MediaTier, key: string): Promise<StoredMedia | null>;
  abstract head(tier: MediaTier, key: string): Promise<MediaIdentity | null>;
  abstract put(
    tier: MediaTier,
    key: string,
    value: StoredMedia,
    identity: MediaIdentity,
  ): Promise<void>;
  abstract delete(tier: MediaTier, key: string): Promise<void>;
}
function missing(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    ['NoSuchKey', 'NotFound'].includes(String(error.name))
  );
}
export class S3MediaObjectStore extends MediaObjectStore {
  private readonly client: S3Client;
  constructor(private readonly env: ServerEnv) {
    super();
    if (
      !env.S3_BUCKET ||
      !env.S3_PUBLIC_BUCKET ||
      env.S3_BUCKET === env.S3_PUBLIC_BUCKET
    )
      throw new Error('Distinct private/public buckets are required');
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT!,
      region: env.S3_REGION!,
      forcePathStyle: true,
      maxAttempts: 2,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  private bucket(tier: MediaTier, key: string) {
    if (
      !/^assets\/[a-f0-9-]{36}\/(source\.(jpeg|png|webp)|p1\/(preview|full)\.webp)$/.test(
        key,
      )
    )
      throw new Error('Invalid media key');
    if (tier === 'PUBLIC' && key.includes('/source.'))
      throw new Error('SOURCE cannot be public');
    return tier === 'PRIVATE'
      ? this.env.S3_BUCKET!
      : this.env.S3_PUBLIC_BUCKET!;
  }
  async get(tier: MediaTier, key: string): Promise<StoredMedia | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket(tier, key), Key: key }),
        { abortSignal: AbortSignal.timeout(30_000) },
      );
      if (!result.Body) throw new Error('Missing media body');
      return {
        bytes: await result.Body.transformToByteArray(),
        mimeType: result.ContentType ?? 'application/octet-stream',
      };
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }
  async head(tier: MediaTier, key: string): Promise<MediaIdentity | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket(tier, key), Key: key }),
        { abortSignal: AbortSignal.timeout(30_000) },
      );
      return {
        sha256: result.Metadata?.sha256 ?? '',
        byteLength: result.ContentLength ?? -1,
        mimeType: result.ContentType ?? '',
      };
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }
  async put(
    tier: MediaTier,
    key: string,
    value: StoredMedia,
    identity: MediaIdentity,
  ) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket(tier, key),
        Key: key,
        Body: value.bytes,
        ContentType: value.mimeType,
        Metadata: { sha256: identity.sha256 },
        IfNoneMatch: '*',
        CacheControl:
          tier === 'PUBLIC'
            ? 'public, max-age=0, must-revalidate, s-maxage=86400'
            : 'private, no-store',
      }),
      { abortSignal: AbortSignal.timeout(30_000) },
    );
  }
  async delete(tier: MediaTier, key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket(tier, key), Key: key }),
      { abortSignal: AbortSignal.timeout(30_000) },
    );
  }
}
