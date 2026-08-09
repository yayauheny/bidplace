import { describe, expect, it } from 'vitest';

import { getProductTabAt } from './product-tabs';

describe('product tab keyboard order', () => {
  it.each([
    [0, 'about'],
    [1, 'creation'],
    [2, 'bids'],
    [3, 'about'],
    [-1, 'bids'],
  ] as const)('maps index %i to %s', (index, tab) => {
    expect(getProductTabAt(index)).toBe(tab);
  });
});
