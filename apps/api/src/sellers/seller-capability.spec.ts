import { describe, expect, it } from 'vitest';

import { sellerMayAcceptOrders } from './seller-capability';

describe('sellerMayAcceptOrders', () => {
  it.each([
    ['active', 'APPROVED', true],
    ['banned', 'APPROVED', false],
    ['active', 'SUSPENDED', false],
    ['active', 'PENDING_REVIEW', false],
    ['active', 'DRAFT', false],
    ['active', 'CHANGES_REQUESTED', false],
    ['active', 'REJECTED', false],
    ['banned', 'SUSPENDED', false],
  ] as const)('user %s and seller %s → %s', (userStatus, sellerStatus, allowed) => {
    expect(sellerMayAcceptOrders({ userStatus, sellerStatus })).toBe(allowed);
  });
});
