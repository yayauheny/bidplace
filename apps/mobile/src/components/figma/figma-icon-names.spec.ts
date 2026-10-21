import { describe, expect, it } from 'vitest';

import { figmaIconNames } from './figma-icon-names';

describe('Figma icon registry', () => {
  it('keeps the Компоненты icon set plus dock and author application extras', () => {
    expect(figmaIconNames).toEqual([
      'filter-horizontal',
      'arrow-up-down',
      'search-01',
      'delete-02',
      'x',
      'arrow-left-01',
      'arrow-right-01',
      'arrow-up-01',
      'arrow-down-01',
      'plus',
      'minus',
      'copy',
      'share-04',
      'share-03',
      'heart',
      'more-vertical',
      'flag-01',
      'link-01',
      'pencil-edit-01',
      'qr-code-01',
      'lock-keyhole',
      'clock-04',
      'telegram',
      'instagram',
      'internet',
      'google',
      'eye-off',
      'view',
      'at-sign',
      'image-01',
      'calendar-01',
      'home-01',
      'ai-magic',
      'user',
      'shopping-basket-01',
      'image-add-02',
      'heading',
      'text',
      'check',
      'setting-07',
      'log-out',
    ]);
  });
});
