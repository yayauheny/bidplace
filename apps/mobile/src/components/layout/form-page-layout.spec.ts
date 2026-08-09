import { describe, expect, it } from 'vitest';

import { getFormPageGutter, isFormPageCompact } from './form-page-layout';

describe('form page layout', () => {
  it.each([
    [390, true],
    [899, true],
    [900, false],
    [1440, false],
  ])('uses %i px compact=%s', (width, compact) => {
    expect(isFormPageCompact(width)).toBe(compact);
  });

  it.each([
    [390, 20],
    [760, 28],
    [1025, 40],
  ])('uses %i px viewport with %i px gutter', (width, gutter) => {
    expect(getFormPageGutter(width)).toBe(gutter);
  });
});
