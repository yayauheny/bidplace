import { describe, expect, it } from 'vitest';

import { getFormPageGutter, isFormPageCompact } from './form-page-layout';

describe('form page layout', () => {
  it.each([390, 899, 900, 1440])(
    'keeps %i px compact in the phone shell',
    (width) => {
      expect(isFormPageCompact(width)).toBe(true);
    },
  );

  it.each([390, 760, 1025])(
    'uses the Figma page gutter at %i px',
    (width) => {
      expect(getFormPageGutter(width)).toBe(12);
    },
  );
});
