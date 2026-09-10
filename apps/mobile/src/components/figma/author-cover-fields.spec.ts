import { describe, expect, it } from 'vitest';

import { figmaTokens } from '@bidplace/design-tokens';

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
    expect(figmaChipTextColor('onDark')).toBe(figmaTokens.color.white);
    expect(figmaChipTextColor('onLight')).toBe(figmaTokens.color.ink);
  });

  it('keeps long names and slugs in the accessible label', () => {
    const content = getAuthorCoverContent({
      fullName: 'Salvador Dalí Estate & Fundació Gala Сальвадор Дали',
      slug: 'quantumparadox-very-long-handle',
      tags: ['Художник-стеклодув'],
    });

    expect(content.handle).toBe('@quantumparadox-very-long-handle');
    expect(authorCoverAccessibilityLabel(content)).toBe(
      'Открыть профиль автора Salvador Dalí Estate & Fundació Gala Сальвадор Дали, @quantumparadox-very-long-handle, Художник-стеклодув',
    );
  });

  it('omits a trailing tag clause when there are zero tags', () => {
    const content = getAuthorCoverContent({
      fullName: 'Клавдия Агаповна',
      slug: 'bala_klava',
      tags: ['', '  '],
    });

    expect(content.tags).toEqual([]);
    expect(authorCoverAccessibilityLabel(content)).toBe(
      'Открыть профиль автора Клавдия Агаповна, @bala_klava',
    );
    expect(authorCoverAccessibilityLabel(content)).not.toMatch(/,\s*$/);
  });
});
