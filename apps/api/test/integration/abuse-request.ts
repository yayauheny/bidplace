import { randomUUID } from 'node:crypto';

import { ScriptedTurnstileVerifier } from '../../src/auth-abuse/turnstile-verifier';

export function turnstileToken(action: string): string {
  return ScriptedTurnstileVerifier.token(action);
}

export function idempotencyKey(): string {
  return randomUUID();
}
