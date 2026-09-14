import { describe, expect, it } from 'vitest';

import { getAuthorWorkColumnCount } from './author-layout';

describe('author work grid layout', () => {
  it.each([390, 620, 900, 1440])(
    'keeps a single phone column at %i px',
    (width) => {
      expect(getAuthorWorkColumnCount(width)).toBe(1);
    },
  );
});
