import { createHash, randomUUID } from 'node:crypto';

import { type ServerEnv, isExplicitLocalTestProfile } from '../core/config';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_TTL_MS = 300_000;
const CLOCK_SKEW_MS = 30_000;
const SITEVERIFY_TIMEOUT_MS = 10_000;

export type TurnstileDecision =
  | { outcome: 'accepted' }
  | { outcome: 'rejected'; errorCodes: string[] }
  | { outcome: 'unavailable' };

export type TurnstileCheck = {
  token: string;
  action: string;
  remoteIp?: string;
  now?: Date;
  idempotencyKey?: string;
};

/** Stable Siteverify identity for one mail send or recovery validation. */
export function turnstileValidationId(input: {
  action: string;
  operationKey: string;
  contentHash: string;
  proof: string;
}): string {
  const proofHash = createHash('sha256').update(input.proof).digest('hex');
  const digest = createHash('sha256')
    .update([input.action, input.operationKey, input.contentHash, proofHash].join('\u0000'))
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x40, 6);
  bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8);
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export abstract class TurnstileVerifier {
  abstract verify(input: TurnstileCheck): Promise<TurnstileDecision>;
}

export function interpretTurnstileResponse(
  body: unknown,
  input: { action: string; hostname: string; now: Date },
): TurnstileDecision {
  if (typeof body !== 'object' || body === null) return { outcome: 'unavailable' };

  const record = body as Record<string, unknown>;
  const errorCodes = Array.isArray(record['error-codes'])
    ? record['error-codes'].filter((item): item is string => typeof item === 'string')
    : [];

  if (errorCodes.includes('internal-error')) return { outcome: 'unavailable' };
  if (record.success !== true) return { outcome: 'rejected', errorCodes };

  if (record.action !== input.action) {
    return { outcome: 'rejected', errorCodes: ['action-mismatch'] };
  }
  if (record.hostname !== input.hostname) {
    return { outcome: 'rejected', errorCodes: ['hostname-mismatch'] };
  }

  const challenge = Date.parse(typeof record.challenge_ts === 'string' ? record.challenge_ts : '');
  if (!Number.isFinite(challenge)) {
    return { outcome: 'rejected', errorCodes: ['missing-challenge-ts'] };
  }

  const age = input.now.getTime() - challenge;
  if (age < -CLOCK_SKEW_MS || age > TOKEN_TTL_MS) {
    return { outcome: 'rejected', errorCodes: ['timeout-or-duplicate'] };
  }

  return { outcome: 'accepted' };
}

export class CloudflareTurnstileVerifier extends TurnstileVerifier {
  constructor(
    private readonly options: {
      secret: string;
      hostname: string;
      fetchImpl?: typeof fetch;
      timeoutMs?: number;
    },
  ) {
    super();
  }

  async verify(input: TurnstileCheck): Promise<TurnstileDecision> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const signal = AbortSignal.timeout(this.options.timeoutMs ?? SITEVERIFY_TIMEOUT_MS);
    let body: unknown;
    try {
      const response = await fetchImpl(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          secret: this.options.secret,
          response: input.token,
          remoteip: input.remoteIp,
          ...(input.idempotencyKey ? { idempotency_key: input.idempotencyKey } : {}),
        }),
        signal,
      });
      if (!response.ok) return { outcome: 'unavailable' };
      body = await response.json();
    } catch {
      return { outcome: 'unavailable' };
    }

    return interpretTurnstileResponse(body, {
      action: input.action,
      hostname: this.options.hostname,
      now: input.now ?? new Date(),
    });
  }
}

export class UnavailableTurnstileVerifier extends TurnstileVerifier {
  verify(): Promise<TurnstileDecision> {
    return Promise.resolve({ outcome: 'unavailable' });
  }
}

const TEST_TOKEN = /^pass:([a-z_]+):([A-Za-z0-9.-]+):([A-Za-z0-9-]+)$/;

/** Local-test double. A new instance does not remember tokens spent by another process. */
export class ScriptedTurnstileVerifier extends TurnstileVerifier {
  private readonly spent = new Map<string, { action: string; validationId?: string }>();

  constructor(private readonly hostname: string) {
    super();
  }

  static token(action: string, hostname = 'localhost'): string {
    return `pass:${action}:${hostname}:${randomUUID()}`;
  }

  async verify(input: TurnstileCheck): Promise<TurnstileDecision> {
    // Official Cloudflare dummy token for manual tests; this verifier is local/test only.
    if (input.token === 'XXXX.DUMMY.TOKEN.XXXX') return { outcome: 'accepted' };
    if (input.token === 'turnstile-unavailable') return { outcome: 'unavailable' };
    const match = TEST_TOKEN.exec(input.token);
    if (!match || match[1] !== input.action || match[2] !== this.hostname) {
      return { outcome: 'rejected', errorCodes: ['invalid-input-response'] };
    }

    const previous = this.spent.get(input.token);
    if (previous) {
      if (
        input.idempotencyKey &&
        previous.validationId === input.idempotencyKey &&
        previous.action === input.action
      ) {
        return { outcome: 'accepted' };
      }
      return { outcome: 'rejected', errorCodes: ['timeout-or-duplicate'] };
    }

    this.spent.set(input.token, {
      action: input.action,
      ...(input.idempotencyKey ? { validationId: input.idempotencyKey } : {}),
    });
    return { outcome: 'accepted' };
  }
}

export function createTurnstileVerifier(
  env: ServerEnv,
  fetchImpl?: typeof fetch,
): TurnstileVerifier {
  if (env.TURNSTILE_VERIFIER === 'test') {
    if (!isExplicitLocalTestProfile(env)) {
      return new UnavailableTurnstileVerifier();
    }
    return new ScriptedTurnstileVerifier(env.TURNSTILE_HOSTNAME ?? 'localhost');
  }

  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_HOSTNAME) {
    return new UnavailableTurnstileVerifier();
  }

  return new CloudflareTurnstileVerifier({
    secret: env.TURNSTILE_SECRET_KEY,
    hostname: env.TURNSTILE_HOSTNAME,
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}
