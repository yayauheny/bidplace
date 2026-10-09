import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

describe('auth client', () => {
  it('parses rules acceptance as the canonical authenticated user response', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            user: {
              id: '2c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
              email: 'seller@example.com',
              phone: '+375291234567',
              emailVerifiedAt: null,
              phoneVerifiedAt: null,
              acceptedRulesVersion: 'MVP_RULES_V1',
              displayName: 'Seller',
              slug: null,
              role: 'user',
              status: 'active',
              createdAt: '2026-09-23T00:00:00.000Z',
              updatedAt: '2026-09-23T00:00:00.000Z',
            },
          }),
          { headers: { 'content-type': 'application/json' } },
        ),
    });

    await expect(
      client.auth.acceptRules({ rulesVersion: 'MVP_RULES_V1' }),
    ).resolves.toMatchObject({
      user: { acceptedRulesVersion: 'MVP_RULES_V1' },
    });
  });

  it('reads slug availability and does not request an invalid nickname', async () => {
    const calls: string[] = [];
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (input) => {
        calls.push(String(input));
        return new Response(JSON.stringify({ available: true }), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    await expect(client.auth.slugAvailability('author')).resolves.toEqual({
      available: true,
    });
    expect(calls).toEqual([
      'https://api.example.test/api/auth/slug-availability?slug=author',
    ]);
    for (const slug of ['Niko 631', 'ab', 'a'.repeat(21)]) {
      await expect(client.auth.slugAvailability(slug)).rejects.toMatchObject({ kind: 'validation' });
    }
    expect(calls).toHaveLength(1);
  });
});
