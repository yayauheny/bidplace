import { describe, expect, it } from 'vitest';

import { ApiClientError, createApiClient } from '../src';

const worksPayload = {
  works: [],
  pagination: { page: 1, limit: 20, total: 0 },
};

function bodyThatAborts(
  signal: AbortSignal | null | undefined,
  onRead: () => void,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    pull(controller) {
      onRead();
      const fail = () => {
        controller.error(new DOMException('The operation was aborted.', 'AbortError'));
      };
      if (signal?.aborted) {
        fail();
        return;
      }
      signal?.addEventListener('abort', fail, { once: true });
    },
  });
}

function readAfterHeaders(
  fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  let markRead: () => void = () => undefined;
  const reading = new Promise<void>((resolve) => {
    markRead = resolve;
  });
  const client = createApiClient({
    baseUrl: 'https://api.example.test',
    fetchImpl: async (input, init) => {
      const response = await fetchImpl(input, init);
      return new Response(bodyThatAborts(init?.signal, markRead), {
        status: response.status,
        headers: response.headers,
      });
    },
  });
  return { client, reading };
}

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

  it('rejects an aborted JSON body after headers without reclassifying AbortError', async () => {
    const controller = new AbortController();
    const { client, reading } = readAfterHeaders(async () =>
      new Response(null, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const pending = client.portfolio.listWorks({ page: 1 }, { signal: controller.signal });
    await reading;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(pending).rejects.not.toBeInstanceOf(ApiClientError);
  });

  it('rejects an aborted error body after headers without reclassifying AbortError', async () => {
    const controller = new AbortController();
    const { client, reading } = readAfterHeaders(async () =>
      new Response(null, {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const pending = client.portfolio.listWorks({ page: 1 }, { signal: controller.signal });
    await reading;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(pending).rejects.not.toBeInstanceOf(ApiClientError);
  });

  it('rejects an aborted image body after headers without reclassifying AbortError', async () => {
    const controller = new AbortController();
    const { client, reading } = readAfterHeaders(async () =>
      new Response(null, {
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
    );

    const pending = client.admin.getProductImage('image-1', { signal: controller.signal });
    await reading;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await expect(pending).rejects.not.toBeInstanceOf(ApiClientError);
  });

  it('does not treat a body error as cancellation only because the signal is aborted', async () => {
    const controller = new AbortController();
    let markRead: () => void = () => undefined;
    const reading = new Promise<void>((resolve) => {
      markRead = resolve;
    });
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_input, init) =>
        new Response(
          new ReadableStream({
            pull(stream) {
              markRead();
              const fail = () => {
                stream.error(new SyntaxError('Unexpected token'));
              };
              if (init?.signal?.aborted) {
                fail();
                return;
              }
              init?.signal?.addEventListener('abort', fail, { once: true });
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });

    const pending = client.portfolio.listWorks({ page: 1 }, { signal: controller.signal });
    await reading;
    controller.abort();
    await expect(pending).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'unexpected_response',
    });
  });

  it('keeps malformed application/json as an unexpected response', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response('{', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });

    await expect(client.portfolio.listWorks({ page: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'unexpected_response',
    });
  });

  it('keeps a schema validation failure as an unexpected response', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(JSON.stringify({ works: [{ broken: true }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });

    await expect(client.portfolio.listWorks({ page: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'unexpected_response',
    });
  });

  it('keeps an ordinary HTTP error classified by status', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ status: 404, code: 'not_found', message: 'missing' }),
          { status: 404, headers: { 'content-type': 'application/json' } },
        ),
    });

    await expect(client.portfolio.listWorks({ page: 1 })).rejects.toMatchObject({
      name: 'ApiClientError',
      kind: 'not_found',
      status: 404,
    });
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
