import { describe, expect, it } from 'vitest';

import { getCatalogColumnCount } from './catalog-layout';

describe('catalog column layout', () => {
  it.each([390, 620, 1024, 1440])(
    'keeps a single phone column at %i px',
    (width) => {
      expect(getCatalogColumnCount(width)).toBe(1);
    },
  );
});
