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
    expect(authorProfileDestination(status)).toBe(destination);
  });

  it('enables cabinet data only for the owner statuses', () => {
    expect(isAuthorCabinetAvailable('APPROVED')).toBe(true);
    expect(isAuthorCabinetAvailable('SUSPENDED')).toBe(true);
    expect(isAuthorCabinetAvailable('PENDING_REVIEW')).toBe(false);
  });
});
