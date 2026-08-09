import { describe, expect, it } from 'vitest';

import { getAuthorWorkColumnCount } from './author-layout';

describe('author work grid layout', () => {
  it.each([
    [390, 1],
    [619, 1],
    [620, 2],
    [899, 2],
    [900, 3],
    [1279, 3],
    [1280, 4],
    [1440, 4],
  ])('uses %i px as a %i-column grid', (width, columns) => {
    expect(getAuthorWorkColumnCount(width)).toBe(columns);
  });
});
