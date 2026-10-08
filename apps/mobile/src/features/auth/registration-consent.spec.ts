import { describe, expect, it } from 'vitest';

import { registrationStillOwns } from './registration-consent';

const owned = {
  mounted: true,
  operation: 2,
  currentOperation: 2,
  epoch: 4,
  currentEpoch: 4,
  userId: 'user-1',
  sessionUserId: 'user-1',
};

describe('registrationStillOwns', () => {
  it('keeps the operation that still matches the session', () => {
    expect(registrationStillOwns(owned)).toBe(true);
    expect(registrationStillOwns({ ...owned, userId: null, sessionUserId: null })).toBe(true);
  });

  it('drops a finished route, a changed operation, or a different session', () => {
    expect(registrationStillOwns({ ...owned, mounted: false })).toBe(false);
    expect(registrationStillOwns({ ...owned, currentOperation: 3 })).toBe(false);
    expect(registrationStillOwns({ ...owned, currentEpoch: 5 })).toBe(false);
    expect(registrationStillOwns({ ...owned, sessionUserId: 'user-2' })).toBe(false);
    expect(registrationStillOwns({ ...owned, userId: null })).toBe(false);
  });
});
