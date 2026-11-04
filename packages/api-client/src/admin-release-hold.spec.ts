import { describe, expect, it, vi } from 'vitest';

import { createAdminClient } from './admin';
import { createRequestContext } from './request';

const userId = '11111111-1111-4111-8111-111111111111';

describe('admin release hold', () => {
  it('posts the existing release-hold contract and rejects an empty note', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = createAdminClient(
      createRequestContext({ baseUrl: 'https://api.example.test', fetchImpl }),
    );

    await expect(client.releaseHold(userId, { note: 'Проверено' })).resolves.toEqual({
      ok: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      `https://api.example.test/api/admin/users/${userId}/release-hold`,
    );
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"note":"Проверено"}');

    expect(() => client.releaseHold(userId, { note: ' ' })).toThrowError(
      expect.objectContaining({ status: 400 }),
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
