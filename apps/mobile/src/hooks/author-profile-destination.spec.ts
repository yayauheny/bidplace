import { describe, expect, it } from 'vitest';

import {
  authorProfileDestination,
  isAuthorCabinetAvailable,
} from './use-seller-capability';

describe('author profile destination', () => {
  it.each([
    [null, '/profile?intro=1'],
    ['DRAFT', '/profile'],
    ['PENDING_REVIEW', '/profile'],
    ['CHANGES_REQUESTED', '/profile'],
    ['REJECTED', '/profile'],
    ['APPROVED', '/cabinet'],
    ['SUSPENDED', '/cabinet'],
  ] as const)('routes %s to %s', (status, destination) => {
    expect(
      authorProfileDestination(status, {
        isLoading: false,
        isError: false,
        isAbsent: status === null,
      }),
    ).toBe(destination);
  });

  it('enables cabinet data only for the owner statuses', () => {
    expect(isAuthorCabinetAvailable('APPROVED')).toBe(true);
    expect(isAuthorCabinetAvailable('SUSPENDED')).toBe(true);
    expect(isAuthorCabinetAvailable('PENDING_REVIEW')).toBe(false);
  });
});

it.each([
  [false, false, true, '/profile?intro=1'],
  [true, false, true, '/profile'],
  [false, true, true, '/profile'],
  [false, false, false, '/profile'],
] as const)(
  'does not confuse unresolved availability loading=%s error=%s absent=%s with absence',
  (isLoading, isError, isAbsent, expected) => {
    expect(
      authorProfileDestination(null, { isLoading, isError, isAbsent }),
    ).toBe(expected);
  },
);
