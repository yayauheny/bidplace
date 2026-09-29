import { describe, expect, it } from 'vitest';

import { ApiClientError, createApiClient } from '../src';

const worksPayload = {
  works: [],
  pagination: { page: 1, limit: 20, total: 0 },
};

describe('request cancellation', () => {
  it('passes AbortSignal through a catalog JSON read', async () => {
    const controller = new AbortController();
    let seen: AbortSignal | undefined;
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_input, init) => {
        seen = init?.signal ?? undefined;
        return new Response(JSON.stringify(worksPayload), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    await expect(
      client.portfolio.listWorks({ page: 1 }, { signal: controller.signal }),
    ).resolves.toMatchObject({ works: [] });
    expect(seen).toBe(controller.signal);
  });

  it('rejects an aborted JSON read without classifying it as a network failure', async () => {
    const controller = new AbortController();
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: (_input, init) =>
        new Promise((_resolve, reject) => {
          const abort = () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          };
          if (init?.signal?.aborted) {
            abort();
            return;
          }
          init?.signal?.addEventListener('abort', abort);
        }),
    });
    const pending = client.portfolio.listWorks(undefined, {
      signal: controller.signal,
    });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(pending).rejects.not.toBeInstanceOf(ApiClientError);
  });

  it('rejects an aborted image read without classifying it as a network failure', async () => {
    const controller = new AbortController();
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: (_input, init) =>
        new Promise((_resolve, reject) => {
          const abort = () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          };
          if (init?.signal?.aborted) {
            abort();
            return;
          }
          init?.signal?.addEventListener('abort', abort);
        }),
    });
    const pending = client.admin.getProductImage('image-1', {
      signal: controller.signal,
    });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(pending).rejects.not.toBeInstanceOf(ApiClientError);
  });

  it('keeps a failed fetch as a network error', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () => {
        throw new TypeError('Failed to fetch');
      },
    });

    await expect(client.portfolio.listWorks()).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'network',
      status: 0,
    });
  });

  it('keeps a malformed catalog response unexpected', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response('not-json', {
          headers: { 'content-type': 'text/plain' },
        }),
    });

    await expect(client.portfolio.home()).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'unexpected_response',
    });
  });
});
