import { createServer } from 'node:http';

import { describe, expect, it, vi } from 'vitest';

import {
  syntheticProductionServerEnv,
  syntheticServerEnv,
} from '../../core/config/synthetic-server-env';
import {
  CloudflareTurnstileVerifier,
  ScriptedTurnstileVerifier,
  UnavailableTurnstileVerifier,
  createTurnstileVerifier,
  interpretTurnstileResponse,
  turnstileValidationId,
} from './turnstile-verifier';

const now = new Date('2026-10-10T00:00:00.000Z');

describe('interpretTurnstileResponse', () => {
  it('accepts a matching action and hostname inside 300 seconds', () => {
    expect(
      interpretTurnstileResponse(
        {
          success: true,
          action: 'login',
          hostname: 'localhost',
          challenge_ts: '2026-10-09T23:59:00.000Z',
        },
        { action: 'login', hostname: 'localhost', now },
      ),
    ).toEqual({ outcome: 'accepted' });
  });

  it('rejects an action or hostname mismatch and an expired challenge', () => {
    expect(
      interpretTurnstileResponse(
        { success: true, action: 'register', hostname: 'localhost', challenge_ts: now.toISOString() },
        { action: 'login', hostname: 'localhost', now },
      ).outcome,
    ).toBe('rejected');
    expect(
      interpretTurnstileResponse(
        { success: true, action: 'login', hostname: 'other.example', challenge_ts: now.toISOString() },
        { action: 'login', hostname: 'localhost', now },
      ).outcome,
    ).toBe('rejected');
    expect(
      interpretTurnstileResponse(
        {
          success: true,
          action: 'login',
          hostname: 'localhost',
          challenge_ts: '2026-10-09T23:50:00.000Z',
        },
        { action: 'login', hostname: 'localhost', now },
      ).outcome,
    ).toBe('rejected');
  });


  it('fails closed when siteverify reports an internal error or the body is unusable', () => {
    expect(
      interpretTurnstileResponse(
        { success: false, 'error-codes': ['internal-error'] },
        { action: 'login', hostname: 'localhost', now },
      ),
    ).toEqual({ outcome: 'unavailable' });
    expect(
      interpretTurnstileResponse(null, { action: 'login', hostname: 'localhost', now }),
    ).toEqual({ outcome: 'unavailable' });
  });
});

describe('createTurnstileVerifier', () => {
  it('accepts the official dummy token only in the explicit local test profile', async () => {
    const token = 'XXXX.DUMMY.TOKEN.XXXX';
    const env = syntheticServerEnv({ TURNSTILE_VERIFIER: 'test', TURNSTILE_HOSTNAME: 'localhost' });
    await expect(createTurnstileVerifier(env).verify({ token, action: 'register' }))
      .resolves.toEqual({ outcome: 'accepted' });
    for (const profile of [
      { NODE_ENV: 'development', APP_ENV: 'local' },
      { NODE_ENV: 'production', APP_ENV: 'local' },
      { NODE_ENV: 'test', APP_ENV: 'staging' },
      { NODE_ENV: 'test', APP_ENV: 'production' },
    ] as const) {
      await expect(createTurnstileVerifier({ ...env, ...profile }).verify({ token, action: 'register' }))
        .resolves.toEqual({ outcome: 'unavailable' });
    }
  });

  it('uses the scripted verifier only for an explicit local test profile', async () => {
    const verifier = createTurnstileVerifier(
      syntheticServerEnv({
        TURNSTILE_VERIFIER: 'test',
        TURNSTILE_HOSTNAME: 'localhost',
      }),
    );
    const token = ScriptedTurnstileVerifier.token('register');
    await expect(verifier.verify({ token, action: 'register' })).resolves.toEqual({
      outcome: 'accepted',
    });
    await expect(verifier.verify({ token, action: 'register' })).resolves.toMatchObject({
      outcome: 'rejected',
    });
  });

  it('fails closed when siteverify times out, the network fails, or the body never finishes', async () => {
    let contentType: string | undefined;
    const server = createServer((request, response) => {
      contentType = request.headers['content-type'];
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"success":');
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const localFetch: typeof fetch = (url, init) => {
      const target = url instanceof URL ? url.toString() : String(url);
      return fetch(target.replace('https://challenges.cloudflare.com', `http://127.0.0.1:${port}`), init);
    };
    const verifier = new CloudflareTurnstileVerifier({
      secret: 'synthetic-turnstile-secret',
      hostname: 'localhost',
      fetchImpl: localFetch,
      timeoutMs: 50,
    });
    const networkFetch: typeof fetch = async () => {
      throw new Error('network down');
    };

    try {
      await expect(verifier.verify({ token: 'live-token', action: 'login' })).resolves.toEqual({
        outcome: 'unavailable',
      });
      expect(contentType).toBe('application/json');
      await expect(
        new CloudflareTurnstileVerifier({
          secret: 'synthetic-turnstile-secret',
          hostname: 'localhost',
          fetchImpl: networkFetch,
          timeoutMs: 50,
        }).verify({ token: 'live-token', action: 'login' }),
      ).resolves.toEqual({ outcome: 'unavailable' });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it('fails closed when siteverify cannot be reached', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network down'));
    const verifier = createTurnstileVerifier(syntheticProductionServerEnv(), fetchImpl);
    await expect(verifier.verify({ token: 'live-token', action: 'login' })).resolves.toEqual({
      outcome: 'unavailable',
    });
  });

  it('sends a stable validation identity and still rejects a mismatched or expired proof', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const fetchImpl: typeof fetch = async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      const requested = bodies.length;
      const body =
        requested === 3
          ? {
              success: true,
              action: 'login',
              hostname: 'localhost',
              challenge_ts: '2026-10-10T00:00:00.000Z',
            }
          : requested === 4
            ? {
                success: true,
                action: 'email_verification',
                hostname: 'localhost',
                challenge_ts: '2026-10-09T23:50:00.000Z',
              }
            : {
                success: true,
                action: 'email_verification',
                hostname: 'localhost',
                challenge_ts: '2026-10-10T00:00:00.000Z',
              };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const verifier = new CloudflareTurnstileVerifier({
      secret: 'synthetic-turnstile-secret',
      hostname: 'localhost',
      fetchImpl,
    });
    const validation = {
      action: 'email_verification',
      operationKey: 'operation-key-1',
      contentHash: 'a'.repeat(64),
      proof: 'proof-a',
    };
    const validationId = turnstileValidationId(validation);
    expect(turnstileValidationId(validation)).toBe(validationId);
    expect(
      turnstileValidationId({ ...validation, proof: 'proof-b' }),
    ).not.toBe(validationId);
    expect(
      turnstileValidationId({ ...validation, operationKey: 'operation-key-2' }),
    ).not.toBe(validationId);
    expect(
      turnstileValidationId({ ...validation, contentHash: 'b'.repeat(64) }),
    ).not.toBe(validationId);
    expect(validationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    await expect(
      verifier.verify({
        token: 'proof-a',
        action: 'email_verification',
        idempotencyKey: validationId,
        now,
      }),
    ).resolves.toEqual({ outcome: 'accepted' });
    await expect(
      verifier.verify({
        token: 'proof-a',
        action: 'email_verification',
        idempotencyKey: validationId,
        now,
      }),
    ).resolves.toEqual({ outcome: 'accepted' });
    expect(bodies[0]?.idempotency_key).toBe(validationId);
    expect(bodies[1]?.idempotency_key).toBe(validationId);
    expect(bodies[0]).not.toHaveProperty('proof');

    await expect(
      verifier.verify({
        token: 'proof-a',
        action: 'email_verification',
        idempotencyKey: validationId,
        now,
      }),
    ).resolves.toMatchObject({ outcome: 'rejected', errorCodes: ['action-mismatch'] });
    await expect(
      verifier.verify({
        token: 'proof-a',
        action: 'email_verification',
        idempotencyKey: validationId,
        now,
      }),
    ).resolves.toMatchObject({ outcome: 'rejected', errorCodes: ['timeout-or-duplicate'] });

    const loginBodies: Array<Record<string, unknown>> = [];
    const loginVerifier = new CloudflareTurnstileVerifier({
      secret: 'synthetic-turnstile-secret',
      hostname: 'localhost',
      fetchImpl: async (_url, init) => {
        loginBodies.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
        return new Response(
          JSON.stringify({
            success: true,
            action: 'login',
            hostname: 'localhost',
            challenge_ts: '2026-10-10T00:00:00.000Z',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      },
    });
    await loginVerifier.verify({ token: 'login-proof', action: 'login', now });
    expect(loginBodies[0]).not.toHaveProperty('idempotency_key');
  });

  it('replays only the same scripted validation identity', async () => {
    const verifier = new ScriptedTurnstileVerifier('localhost');
    const token = ScriptedTurnstileVerifier.token('email_verification');
    const validationId = '11111111-1111-4111-8111-111111111111';
    await expect(
      verifier.verify({ token, action: 'email_verification', idempotencyKey: validationId }),
    ).resolves.toEqual({ outcome: 'accepted' });
    await expect(
      verifier.verify({ token, action: 'email_verification', idempotencyKey: validationId }),
    ).resolves.toEqual({ outcome: 'accepted' });
    await expect(
      verifier.verify({
        token,
        action: 'email_verification',
        idempotencyKey: '22222222-2222-4222-8222-222222222222',
      }),
    ).resolves.toMatchObject({ outcome: 'rejected' });
    await expect(verifier.verify({ token, action: 'email_verification' })).resolves.toMatchObject({
      outcome: 'rejected',
    });
    await expect(
      verifier.verify({ token, action: 'login', idempotencyKey: validationId }),
    ).resolves.toMatchObject({ outcome: 'rejected' });

    const login = new ScriptedTurnstileVerifier('localhost');
    const loginToken = ScriptedTurnstileVerifier.token('login');
    await expect(login.verify({ token: loginToken, action: 'login' })).resolves.toEqual({
      outcome: 'accepted',
    });
    await expect(login.verify({ token: loginToken, action: 'login' })).resolves.toMatchObject({
      outcome: 'rejected',
    });
  });

  it('does not enable the test verifier outside the local test profile', () => {
    const verifier = createTurnstileVerifier({
      ...syntheticServerEnv(),
      NODE_ENV: 'development',
      TURNSTILE_VERIFIER: 'test',
    });
    expect(verifier).toBeInstanceOf(UnavailableTurnstileVerifier);
  });
});
