import { describe, expect, it } from 'vitest';

import { getAuthLayoutGutter, getAuthLayoutMode } from './auth-layout';

describe('auth layout', () => {
  it.each([
    [390, 'stacked'],
    [899, 'stacked'],
    [900, 'split'],
    [1440, 'split'],
  ] as const)('uses %i px as %s composition', (width, mode) => {
    expect(getAuthLayoutMode(width)).toBe(mode);
  });

  it.each([
    [390, 20],
    [760, 28],
    [1025, 40],
  ])('uses %i px viewport with %i px gutter', (width, gutter) => {
    expect(getAuthLayoutGutter(width)).toBe(gutter);
  });
});
