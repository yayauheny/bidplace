import { S3Client } from '@aws-sdk/client-s3';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { syntheticServerEnv } from '../config/synthetic-server-env';
import { S3ImageStore } from './s3-image-store';

function s3Env() {
  return syntheticServerEnv({
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'http://minio.local',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'bidplace-media',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY: 'test-secret-key',
  });
}

describe('S3ImageStore', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes an object with the configured bucket and MIME type', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({});
    const store = new S3ImageStore(s3Env());

    await store.put('product-image:image-id', {
      bytes: Uint8Array.from([1, 2]),
      mimeType: 'image/png',
    });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bidplace-media',
          Key: 'product-image:image-id',
          ContentType: 'image/png',
        }),
      }),
    );
  });

  it('returns null when S3 reports a missing object', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue({ name: 'NoSuchKey' });
    const store = new S3ImageStore(s3Env());

    await expect(store.get('product-image:missing')).resolves.toBeNull();
  });

  it('deletes the configured object key', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({});
    const store = new S3ImageStore(s3Env());

    await store.delete('product-image:image-id');

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: 'bidplace-media',
          Key: 'product-image:image-id',
        }),
      }),
    );
  });
});
