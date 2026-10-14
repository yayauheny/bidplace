import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { figmaChipTextColor } from './figma-chip-style';
import {
  authorCoverAccessibilityLabel,
  getAuthorCoverContent,
} from './author-cover-fields';

describe('Author identity chips', () => {
  it('drops empty tags and keeps chips non-commerce', () => {
    const content = getAuthorCoverContent({
      fullName: 'Илья Васильев',
      slug: 'vex',
      tags: ['Керамика', '  ', 'Скульптор'],
    });

    expect(content.handle).toBe('@vex');
    expect(content.tags).toEqual(['Керамика', 'Скульптор']);
    expect(authorCoverAccessibilityLabel(content)).toContain('Керамика');
    expect(figmaChipTextColor('onDark')).toBe(designTokens.color.white);
    expect(figmaChipTextColor('onLight')).toBe(designTokens.color.ink);
  });
});
