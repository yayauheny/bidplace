import { describe, expect, it } from 'vitest';

import { getMobileMenuWidth } from './mobile-menu-layout';

describe('mobile menu width', () => {
  it.each([
    [320, 288],
    [375, 320],
    [390, 320],
  ])('keeps a 16px gutter at %ipx', (viewportWidth, expectedWidth) => {
    expect(getMobileMenuWidth(viewportWidth)).toBe(expectedWidth);
  });
});
