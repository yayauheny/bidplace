import { describe, expect, it } from 'vitest';

import { createApiClient } from '../src';

const proof = 'synthetic-turnstile-proof';
const key = 'idem-key-1';
const user = {
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
};

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

  it('forwards the caller abort signal on logout', async () => {
    const controller = new AbortController();
    let seen: AbortSignal | undefined;
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_input, init) => {
        if (init?.signal?.aborted) {
          throw new DOMException('The operation was aborted', 'AbortError');
        }
        seen = init?.signal ?? undefined;
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    await expect(client.auth.logout({ signal: controller.signal })).resolves.toEqual({
      ok: true,
    });
    expect(seen).toBe(controller.signal);

    controller.abort();
    await expect(client.auth.logout({ signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('rejects a blank OTP or forgot proof and a short idempotency key before fetch', async () => {
    const calls: string[] = [];
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (input) => {
        calls.push(String(input));
        return new Response(JSON.stringify({ ok: true, delivery: 'accepted' }), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    expect(() =>
      client.auth.requestEmailVerification({ idempotencyKey: key, turnstileToken: '' }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
    expect(() =>
      client.auth.requestEmailVerification({ idempotencyKey: 'short', turnstileToken: proof }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
    expect(() =>
      client.auth.verifyEmailVerification({ code: '123456', idempotencyKey: 'short' }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
    expect(() =>
      client.auth.forgotPassword({
        email: 'author@example.com',
        idempotencyKey: key,
        turnstileToken: '',
      }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
    expect(() =>
      client.auth.forgotPassword({
        email: 'author@example.com',
        idempotencyKey: 'short',
        turnstileToken: proof,
      }),
    ).toThrow(expect.objectContaining({ kind: 'validation' }));
    expect(calls).toEqual([]);
  });

  it('sends login without a Turnstile proof and forwards one when the caller has it', async () => {
    const bodies: unknown[] = [];
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async (_input, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(JSON.stringify({ user }), {
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    const credentials = { email: 'author@example.com', password: 'password123' };
    await expect(client.auth.login(credentials)).resolves.toMatchObject({
      user: { email: user.email },
    });
    await expect(
      client.auth.login({ ...credentials, turnstileToken: proof }),
    ).resolves.toMatchObject({ user: { email: user.email } });
    expect(bodies).toEqual([credentials, { ...credentials, turnstileToken: proof }]);
  });

  it('keeps OTP delivery on the parsed send response', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(JSON.stringify({ ok: true, delivery: 'unknown' }), {
          headers: { 'content-type': 'application/json' },
        }),
    });

    await expect(
      client.auth.requestEmailVerification({ idempotencyKey: key, turnstileToken: proof }),
    ).resolves.toEqual({ ok: true, delivery: 'unknown' });
  });
});
