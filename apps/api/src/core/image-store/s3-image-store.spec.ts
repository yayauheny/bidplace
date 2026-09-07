import { S3Client } from '@aws-sdk/client-s3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { S3ImageStore } from './s3-image-store';

describe('S3ImageStore', () => {
  beforeEach(() => {
    vi.stubEnv('MEDIA_STORAGE_PROVIDER', 's3');
    vi.stubEnv('S3_ENDPOINT', 'http://minio.local');
    vi.stubEnv('S3_REGION', 'us-east-1');
    vi.stubEnv('S3_BUCKET', 'bidplace-media');
    vi.stubEnv('S3_ACCESS_KEY_ID', 'test-access-key');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', 'test-secret-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('writes an object with the configured bucket and MIME type', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({});
    const store = new S3ImageStore();

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
    const store = new S3ImageStore();

    await expect(store.get('product-image:missing')).resolves.toBeNull();
  });

  it('deletes the configured object key', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({});
    const store = new S3ImageStore();

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
