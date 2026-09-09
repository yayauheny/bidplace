import { describe, expect, it } from 'vitest';

import { getAuthLayoutGutter, getAuthLayoutMode } from './auth-layout';

describe('auth layout', () => {
  it.each([390, 899, 900, 1440] as const)(
    'keeps %i px stacked in the phone shell',
    (width) => {
      expect(getAuthLayoutMode(width)).toBe('stacked');
    },
  );

  it.each([390, 760, 1025])(
    'uses the Figma page gutter at %i px',
    (width) => {
      expect(getAuthLayoutGutter(width)).toBe(12);
    },
  );
});
