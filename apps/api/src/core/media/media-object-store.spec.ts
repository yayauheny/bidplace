import { S3Client } from '@aws-sdk/client-s3';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { syntheticServerEnv } from '../config/synthetic-server-env';
import { S3MediaObjectStore } from './media-object-store';
const key = 'assets/11111111-1111-4111-a111-111111111111/p1/preview.webp';
const env = () =>
  syntheticServerEnv({
    MEDIA_STORAGE_PROVIDER: 's3',
    S3_ENDPOINT: 'https://r2.example.com',
    S3_REGION: 'auto',
    S3_BUCKET: 'private',
    S3_PUBLIC_BUCKET: 'public',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
    MEDIA_PUBLIC_BASE_URL: 'https://media.example.com',
    CLOUDFLARE_ZONE_ID: 'a'.repeat(32),
    CLOUDFLARE_CACHE_TOKEN: 'test',
  });
afterEach(() => vi.restoreAllMocks());
describe('tiered S3 media transport', () => {
  it('uses separate buckets and conditional writes with browser revalidation', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue(undefined);
    const store = new S3MediaObjectStore(env());
    const object = { bytes: Uint8Array.from([1]), mimeType: 'image/webp' };
    await store.put('PRIVATE', key.replace('/p1/', '/p2/'), object, {
      sha256: 'a'.repeat(64),
      byteLength: 1,
      mimeType: object.mimeType,
    });
    await store.put('PUBLIC', key, object, {
      sha256: 'a'.repeat(64),
      byteLength: 1,
      mimeType: object.mimeType,
    });
    expect(send.mock.calls[0]?.[0].input).toMatchObject({
      Bucket: 'private',
      IfNoneMatch: '*',
      CacheControl: 'private, no-store',
    });
    expect(send.mock.calls[1]?.[0].input).toMatchObject({
      Bucket: 'public',
      IfNoneMatch: '*',
      CacheControl: 'public, max-age=0, must-revalidate, s-maxage=86400',
    });
  });
  it('rejects SOURCE and arbitrary keys in the public tier before issuing an SDK command', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue(undefined);
    const store = new S3MediaObjectStore(env());
    await expect(
      store.get('PUBLIC', key.replace('p1/preview.webp', 'source.png')),
    ).rejects.toThrow('SOURCE');
    await expect(
      store.delete('PUBLIC', '../private/source.png'),
    ).rejects.toThrow('Invalid');
    expect(send).not.toHaveBeenCalled();
  });
  it('rejects an aborted publication deadline before public writes or reads', async () => {
    const send = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue(undefined);
    const store = new S3MediaObjectStore(env());
    const signal = AbortSignal.abort(new Error('Publication expired'));
    await expect(store.get('PUBLIC', key, signal)).rejects.toThrow('Publication expired');
    await expect(store.put('PUBLIC', key, { bytes: new Uint8Array([1]), mimeType: 'image/webp' }, {
      sha256: 'a'.repeat(64), byteLength: 1, mimeType: 'image/webp',
    }, signal)).rejects.toThrow('Publication expired');
    expect(send).not.toHaveBeenCalled();
  });
  it('aborts an in-progress body read when publication expires', async () => {
    const controller = new AbortController();
    let started!: () => void;
    let rejectRead!: (error: Error) => void;
    const reading = new Promise<void>((resolve) => { started = resolve; });
    const body = {
      transformToByteArray: () => {
        started();
        return new Promise<Uint8Array>((_resolve, reject) => { rejectRead = reject; });
      },
      destroy: (error: Error) => { rejectRead(error); },
    };
    vi.spyOn(S3Client.prototype, 'send').mockImplementation(async () => ({ Body: body, ContentType: 'image/webp' }));
    const read = new S3MediaObjectStore(env()).get('PUBLIC', key, controller.signal);
    await reading;
    controller.abort();
    await expect(read).rejects.toThrow('Media read aborted');
  });
  it('does not turn authentication/provider errors into a missing object', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue({
      name: 'AccessDenied',
    });
    await expect(
      new S3MediaObjectStore(env()).get('PRIVATE', key),
    ).rejects.toEqual({ name: 'AccessDenied' });
  });
});
