import { afterEach, describe, expect, it, vi } from 'vitest';
import { syntheticServerEnv } from '../config/synthetic-server-env';
import {
  CloudflarePublicMediaCache,
  publicMediaUrl,
} from './public-media-cache';
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
afterEach(() => vi.unstubAllGlobals());
describe('public media cache', () => {
  it('constructs only custom-domain derivative URLs', () => {
    expect(publicMediaUrl('https://media.example.com', key)).toBe(
      `https://media.example.com/${key}`,
    );
    expect(() =>
      publicMediaUrl(
        'https://media.example.com',
        key.replace('p1/preview.webp', 'source.jpeg'),
      ),
    ).toThrow();
  });
  it('purges exact URLs and rejects an unsuccessful Cloudflare response', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: false }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetch);
    await expect(
      new CloudflarePublicMediaCache(env()).purge([
        `https://media.example.com/${key}`,
      ]),
    ).rejects.toThrow('CDN purge failed');
    expect(JSON.parse(fetch.mock.calls[0]?.[1].body)).toEqual({
      files: [`https://media.example.com/${key}`],
    });
  });
  it('rejects foreign origins before calling Cloudflare', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await expect(
      new CloudflarePublicMediaCache(env()).purge([
        'https://foreign.example.com/image',
      ]),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});
