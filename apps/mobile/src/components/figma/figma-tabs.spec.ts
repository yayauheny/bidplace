import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { figmaTabLabelColor } from './figma-tabs';

describe('Figma tabs', () => {
  it('uses the author-page inactive ink from 621:19524', () => {
    expect(figmaTabLabelColor(true)).toBe(figmaTokens.color.ink);
    expect(figmaTabLabelColor(false)).toBe('#565656');
  });
});
