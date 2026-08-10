import { describe, expect, it } from 'vitest';

import { getProductTabAt, parseProductTabParam } from './product-tabs';

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

describe('product tab URL parameter', () => {
  it.each([
    [undefined, 'about'],
    ['about', 'about'],
    ['creation', 'creation'],
    ['bids', 'bids'],
    ['unknown', 'about'],
    [['bids', 'creation'], 'bids'],
  ] as const)('maps %j to %s', (value, tab) => {
    expect(parseProductTabParam(value)).toBe(tab);
  });
});
