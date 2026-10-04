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
