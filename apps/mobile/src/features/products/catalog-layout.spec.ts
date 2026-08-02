import { describe, expect, it } from 'vitest';

import { getCatalogColumnCount } from './catalog-layout';

describe('catalog column layout', () => {
  it.each([
    [899, 2],
    [900, 3],
    [1024, 3],
    [1025, 3],
    [1439, 3],
    [1440, 4],
  ])('uses %i columns at %i px', (width, columns) => {
    expect(getCatalogColumnCount(width)).toBe(columns);
  });
});
