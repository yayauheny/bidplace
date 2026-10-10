import { describe, expect, it } from 'vitest';

import {
  cooldownAfterSends,
  latestExhaustedQuotaReset,
  LOGIN_WINDOW_MS,
  normalizeEmail,
  PERSONAL_MAIL_WINDOW_MS,
  recentLoginFailures,
} from './auth-abuse.policy';

describe('auth abuse policy', () => {
  it('waits longer after each successive send', () => {
    expect(cooldownAfterSends(0)).toBe(0);
    expect(cooldownAfterSends(1)).toBe(60_000);
    expect(cooldownAfterSends(2)).toBe(120_000);
    expect(cooldownAfterSends(3)).toBe(300_000);
    expect(cooldownAfterSends(9)).toBe(300_000);
  });

  it('normalizes an email address', () => {
    expect(normalizeEmail('  Person@Example.COM ')).toBe('person@example.com');
  });

  it('keeps only failures strictly inside the last 15 minutes, capped at five', () => {
    const start = new Date('2026-10-10T00:00:00.000Z');
    const at = (milliseconds: number) => new Date(start.getTime() + milliseconds);
    const fourteenFiftyNine = at(14 * 60_000 + 59_000);
    const fifteen = at(LOGIN_WINDOW_MS);

    expect(
      recentLoginFailures(
        [start, fourteenFiftyNine, fourteenFiftyNine, fourteenFiftyNine, fourteenFiftyNine],
        fifteen,
      ),
    ).toEqual([fourteenFiftyNine, fourteenFiftyNine, fourteenFiftyNine, fourteenFiftyNine]);

    const recent = [5, 8, 11, 13, 14].map((minute) => at(minute * 60_000));
    expect(recentLoginFailures([start, ...recent], fifteen)).toEqual(recent);

    const retained = [1, 2, 3, 4, 5].map((minute) => at(minute * 60_000));
    const oldestRetainedExpires = new Date(retained[0].getTime() + LOGIN_WINDOW_MS);
    expect(recentLoginFailures([start, ...retained], oldestRetainedExpires)).toEqual(retained.slice(1));
  });

  it('uses the latest reset among exhausted quota scopes only', () => {
    const earlier = new Date('2026-10-10T00:00:00.000Z');
    const later = new Date('2026-10-10T06:00:00.000Z');
    const ten = (at: Date) => Array.from({ length: 10 }, () => at);
    expect(latestExhaustedQuotaReset([ten(earlier), [later, later, later]])).toEqual(
      new Date(earlier.getTime() + PERSONAL_MAIL_WINDOW_MS),
    );
    expect(latestExhaustedQuotaReset([ten(earlier), ten(later)])).toEqual(
      new Date(later.getTime() + PERSONAL_MAIL_WINDOW_MS),
    );

    const overflow = Array.from(
      { length: 12 },
      (_, index) => new Date(earlier.getTime() + index * 60_000),
    );
    const boundarySpend = overflow[2];
    expect(boundarySpend).toBeDefined();
    expect(latestExhaustedQuotaReset([overflow])).toEqual(
      new Date((boundarySpend ?? earlier).getTime() + PERSONAL_MAIL_WINDOW_MS),
    );
    expect(latestExhaustedQuotaReset([overflow.slice(0, 9)])).toBeNull();
  });
});
