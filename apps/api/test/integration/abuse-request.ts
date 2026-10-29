import { randomUUID } from 'node:crypto';

import { ScriptedTurnstileVerifier } from '../../src/antifraud/auth/turnstile-verifier';

export function turnstileToken(action: string): string {
  return ScriptedTurnstileVerifier.token(action);
}

export function idempotencyKey(): string {
  return randomUUID();
}
