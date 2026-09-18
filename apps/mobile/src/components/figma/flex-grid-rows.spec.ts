import { describe, expect, it } from 'vitest';

import { paddedGridRows } from './flex-grid-rows';

describe('paddedGridRows', () => {
  it('keeps a single column as one item per row', () => {
    expect(paddedGridRows(['a', 'b', 'c'], 1)).toEqual([['a'], ['b'], ['c']]);
  });

  it('pads an incomplete two-column row so the last cell keeps column width', () => {
    expect(paddedGridRows(['a', 'b', 'c'], 2)).toEqual([
      ['a', 'b'],
      ['c', null],
    ]);
  });

  it('pads a three-column row', () => {
    expect(paddedGridRows(['a'], 3)).toEqual([['a', null, null]]);
  });
});
