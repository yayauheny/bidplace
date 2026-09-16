import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

import { figmaTabLabelColor } from './figma-tabs';

describe('Figma tabs', () => {
  it('uses the author-page inactive ink from 621:19524', () => {
    expect(figmaTabLabelColor(true)).toBe(figmaTokens.color.ink);
    expect(figmaTabLabelColor(false)).toBe('#565656');
  });

  it('insets only the label rail when contentInset is set', () => {
    const web = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'FigmaTabs.web.tsx'),
      'utf8',
    );
    expect(web).toContain('contentInset = 0');
    expect(web).toContain('paddingLeft: contentInset');
    expect(web).toContain('paddingRight: contentInset');
    expect(web).toContain('borderBottom:');
    expect(web.indexOf('borderBottom:')).toBeLessThan(
      web.indexOf('paddingLeft: contentInset'),
    );
  });
});
