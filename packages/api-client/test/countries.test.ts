import { describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '../src/errors';
import { createCountriesClient } from '../src/countries';
import { createRequestContext } from '../src/request';

const countries = [{ code: 'BY', name: 'Беларусь' }];

function client(fetchImpl: typeof fetch) {
  return createCountriesClient(
    createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
  );
}

function countriesResponse(body: unknown = { countries }) {
  return vi.fn<typeof fetch>(async () => Response.json(body));
}

describe('countries list', () => {
  it('sends the trimmed search text as q and returns the parsed options', async () => {
    const fetchImpl = countriesResponse();

    const result = await client(fetchImpl).list('  Бел  ');

    const [url] = fetchImpl.mock.calls[0]!;
    expect(new URL(String(url)).pathname).toBe('/api/countries');
    expect(new URL(String(url)).searchParams.get('q')).toBe('Бел');
    expect(result).toEqual({ countries });
  });

  it('does not send q when there is no search text', async () => {
    const fetchImpl = countriesResponse();
    const countriesClient = client(fetchImpl);

    await countriesClient.list();
    await countriesClient.list('   ');

    for (const [url] of fetchImpl.mock.calls) {
      const parsed = new URL(String(url));
      expect(parsed.pathname).toBe('/api/countries');
      expect(parsed.search).toBe('');
    }
  });

  it('rejects a response whose code is not an ISO alpha-2 value as an unexpected response', async () => {
    const fetchImpl = countriesResponse({
      countries: [{ code: 'Belarus', name: 'Беларусь' }],
    });

    const request = client(fetchImpl).list('Бел');

    await expect(request).rejects.toBeInstanceOf(ApiClientError);
    await expect(request).rejects.toMatchObject({
      kind: 'unexpected_response',
    });
  });

  it('passes the caller AbortSignal to fetch', async () => {
    const fetchImpl = countriesResponse();
    const controller = new AbortController();

    await client(fetchImpl).list('Бел', { signal: controller.signal });

    const [, init] = fetchImpl.mock.calls[0]!;
    expect(init?.signal).toBe(controller.signal);
  });
});
