import { describe, expect, it, vi } from 'vitest';

import { createCommerceClient } from './commerce';
import { createRequestContext } from './request';

const contacts = {
  phone: '+375291112233',
  telegram: '@deal_owner',
  instagram: null,
  vk: null,
  showToBuyer: null,
};

describe('deal contacts client', () => {
  it('reads and writes /api/me/contacts and forwards cancellation', async () => {
    const calls: Array<{ url: string; method: string; body: string | null; signal: AbortSignal | null }> = [];
    const controller = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
      calls.push({
        url: String(url),
        method: init?.method ?? 'GET',
        body: typeof init?.body === 'string' ? init.body : null,
        signal: init?.signal ?? null,
      });
      return new Response(JSON.stringify(contacts), {
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const client = createCommerceClient(
      createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
    );

    await expect(client.getContacts({ signal: controller.signal })).resolves.toEqual(
      contacts,
    );
    await expect(
      client.updateContacts({ phone: null }, { signal: controller.signal }),
    ).resolves.toEqual(contacts);

    expect(calls.map((call) => [call.method, call.url, call.body])).toEqual([
      ['GET', 'https://api.example.test/api/me/contacts', null],
      ['PUT', 'https://api.example.test/api/me/contacts', '{"phone":null}'],
    ]);
    expect(calls.every((call) => call.signal === controller.signal)).toBe(true);
  });
});
