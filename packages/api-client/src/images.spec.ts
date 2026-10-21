import { describe, expect, it, vi } from 'vitest';
import { createImagesClient } from './images';
import { createRequestContext } from './request';

describe('Work upload identity', () => {
  it('keeps one stable key per file when the whole selection is retried after an unknown response', async () => {
    const requests: RequestInit[] = [];
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        requests.push(init!);
        if (requests.length === 2) throw new Error('response lost');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      });
    const client = createImagesClient(
      createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
    );
    const images = [
      new Blob(['first'], { type: 'image/png' }),
      new Blob(['second'], { type: 'image/png' }),
    ];
    await expect(client.add('work-id', images, 'selection')).rejects.toThrow();
    await client.add('work-id', images, 'selection');
    expect(
      requests.map((request) =>
        new Headers(request.headers).get('Idempotency-Key'),
      ),
    ).toEqual(['selection:0', 'selection:1', 'selection:0', 'selection:1']);
    expect(
      requests.every(
        (request) =>
          request.body instanceof FormData &&
          request.body.getAll('images').length === 1,
      ),
    ).toBe(true);
  });
});

describe('Work story image lifecycle', () => {
  it('uploads once using an idempotency identity and returns the media asset id', async () => {
    const id = '81111111-1111-4111-8111-111111111111';
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url, init) => {
        requests.push({ url: String(url), init: init! });
        return new Response(JSON.stringify({ mediaAssetId: id }), {
          headers: { 'Content-Type': 'application/json' },
        });
      });
    const client = createImagesClient(
      createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
    );

    expect(
      await client.addStoryImage(
        'work-id',
        new Blob(['image'], { type: 'image/png' }),
        'one-upload',
      ),
    ).toEqual({
      mediaAssetId: id,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe(
      'https://api.example.test/api/products/work-id/story-images',
    );
    expect(requests[0]?.init.method).toBe('POST');
    expect(new Headers(requests[0]?.init.headers).get('Idempotency-Key')).toBe(
      'one-upload',
    );
    expect(requests[0]?.init.body).toBeInstanceOf(FormData);
    expect((requests[0]?.init.body as FormData).getAll('image')).toHaveLength(
      1,
    );
  });
});

describe('Authenticated Work Story previews', () => {
  it('reads draft story assets and reused gallery images through cookie-authenticated requests', async () => {
    const requests: Array<{ url: string; headers: Headers }> = [];
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async (url, init) => {
        requests.push({
          url: String(url),
          headers: new Headers(init?.headers),
        });
        return new Response(new Blob(['image'], { type: 'image/png' }), {
          headers: { 'Content-Type': 'image/png' },
        });
      });
    const client = createImagesClient(
      createRequestContext({
        baseUrl: 'https://api.example.test',
        credentials: 'include',
        fetchImpl,
      }),
    );
    expect((await client.getStoryImage('work-id', 'asset-id')).type).toBe(
      'image/png',
    );
    expect((await client.getImage('gallery-id')).type).toBe('image/png');
    expect(requests.map(({ url }) => url)).toEqual([
      'https://api.example.test/api/products/work-id/story-images/asset-id',
      'https://api.example.test/api/images/gallery-id',
    ]);
    expect(requests.every(({ headers }) => !headers.has('Authorization'))).toBe(
      true,
    );
  });
});
