import { describe, expect, it } from 'vitest';

import { resolveEmailRulesEligibility } from './email-rules-eligibility';

const user = {
  emailVerifiedAt: '2026-08-12T00:00:00.000Z',
  acceptedRulesVersion: 'MVP_RULES_V1',
};

describe('email and rules bid eligibility', () => {
  it.each([
    ['loading', { ready: false }],
    ['guest', { ready: true, authenticated: false }],
    ['admin', { ready: true, authenticated: true, admin: true }],
    [
      'email',
      {
        ready: true,
        authenticated: true,
        user: { ...user, emailVerifiedAt: null },
      },
    ],
    [
      'rules',
      {
        ready: true,
        authenticated: true,
        rulesVersion: 'MVP_RULES_V2',
      },
    ],
    [
      'ready',
      {
        ready: true,
        authenticated: true,
        rulesVersion: 'MVP_RULES_V1',
      },
    ],
  ] as const)(
    '%s is server-derived and not optimistic',
    (expected, overrides) => {
      const input = Object.assign(
        {
          ready: true,
          authenticated: true,
          admin: false,
          user,
          rulesVersion: 'MVP_RULES_V1',
          rulesLoading: false,
          rulesError: false,
        },
        overrides,
      );
      expect(resolveEmailRulesEligibility(input)).toBe(expected);
    },
  );

  it('keeps the action unavailable when rules fail to load', () => {
    expect(
      resolveEmailRulesEligibility({
        ready: true,
        authenticated: true,
        admin: false,
        user,
        rulesVersion: null,
        rulesLoading: false,
        rulesError: true,
      }),
    ).toBe('error');
  });
});
