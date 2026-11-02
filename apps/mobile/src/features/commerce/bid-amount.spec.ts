import { describe, expect, it } from 'vitest';

import { attemptKey, attemptOutcome, bidPress, steppedAmount } from './bid-amount';

describe('bid amount', () => {
  it('steps by one band and does not go under the server minimum', () => {
    expect(
      steppedAmount({ minimumMinor: 50_000, stepMinor: 100, amountMinor: 50_000, direction: -1 }),
    ).toBe(50_000);
    expect(
      steppedAmount({ minimumMinor: 50_000, stepMinor: 100, amountMinor: 50_000, direction: 1 }),
    ).toBe(50_100);
  });

  it('asks for a second press when the amount is more than twice the minimum', () => {
    expect(bidPress({ amountMinor: 100_000, minimumMinor: 50_000, confirming: false })).toEqual({
      confirming: false,
      submit: true,
    });
    expect(bidPress({ amountMinor: 100_001, minimumMinor: 50_000, confirming: false })).toEqual({
      confirming: true,
      submit: false,
    });
    expect(bidPress({ amountMinor: 100_001, minimumMinor: 50_000, confirming: true })).toEqual({
      confirming: false,
      submit: true,
    });
  });

  it('keeps one idempotency key until the body changes or the attempt is accepted', () => {
    const first = attemptKey({ current: null, currentBody: null, body: '50100' });
    const retry = attemptKey({
      current: first.key,
      currentBody: first.body,
      body: '50100',
    });
    expect(retry.key).toBe(first.key);
    const changed = attemptKey({
      current: first.key,
      currentBody: first.body,
      body: '50200',
    });
    expect(changed.key).not.toBe(first.key);
    const accepted = attemptKey({ current: null, currentBody: null, body: '50100' });
    expect(accepted.key).not.toBe(first.key);
  });

  it('treats a lost response as unknown and a refusal as rejected', () => {
    expect(attemptOutcome('network')).toBe('unknown');
    expect(attemptOutcome('server')).toBe('unknown');
    expect(attemptOutcome('unexpected_response')).toBe('unknown');
    expect(attemptOutcome('conflict')).toBe('rejected');
  });
});
