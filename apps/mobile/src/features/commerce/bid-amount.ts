export function steppedAmount(input: {
  minimumMinor: number;
  stepMinor: number;
  amountMinor: number;
  direction: -1 | 1;
}): number {
  const next = input.amountMinor + input.direction * input.stepMinor;
  return Math.max(input.minimumMinor, next);
}

export function bidPress(input: {
  amountMinor: number;
  minimumMinor: number;
  confirming: boolean;
}): { confirming: boolean; submit: boolean } {
  if (input.amountMinor <= input.minimumMinor * 2 || input.confirming) {
    return { confirming: false, submit: true };
  }
  return { confirming: true, submit: false };
}

export function attemptKey(input: {
  current: string | null;
  currentBody: string | null;
  body: string;
}): { key: string; body: string } {
  if (input.current !== null && input.currentBody === input.body) {
    return { key: input.current, body: input.body };
  }
  return { key: crypto.randomUUID(), body: input.body };
}

export function attemptOutcome(kind: string | undefined): 'rejected' | 'unknown' {
  if (kind === 'network' || kind === 'unexpected_response' || kind === 'server') {
    return 'unknown';
  }
  return 'rejected';
}
