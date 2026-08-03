import { describe, expect, it } from 'vitest';

import { getAuthorWorkColumnCount } from './author-layout';

describe('author work grid layout', () => {
  it.each([
    [390, 2],
    [1024, 2],
    [1025, 3],
    [1440, 3],
  ])('uses %i columns at %i px', (width, columns) => {
    expect(getAuthorWorkColumnCount(width)).toBe(columns);
  });
});
