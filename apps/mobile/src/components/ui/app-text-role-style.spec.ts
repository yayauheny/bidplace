import { describe, expect, it } from 'vitest';

import { appTextRoleStyle } from './app-text-role-style';

describe('AppText letter-spacing', () => {
  it('keeps editorialTitle tracking as em on web so -2% is not dropped', () => {
    expect(appTextRoleStyle('editorialTitle', 'web').letterSpacing).toBe(
      '-0.02em',
    );
  });

  it('keeps a pixel fallback on native', () => {
    expect(appTextRoleStyle('editorialTitle', 'ios').letterSpacing).toBe(-0.4);
    expect(appTextRoleStyle('authorRowHandle', 'ios').letterSpacing).toBe(
      -0.22,
    );
  });
});
