import { describe, expect, it } from 'vitest';

import { figmaDeferredIconNames, figmaIconNames } from './figma-icon-names';

describe('Figma icon registry', () => {
  it('keeps the Компоненты icon set plus dock extras', () => {
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
      'qr-code-01',
      'lock-keyhole',
      'clock-04',
      'telegram',
      'google',
      'eye-off',
      'view',
      'at-sign',
      'image-01',
      'calendar-01',
      'ai-magic',
      'user',
      'shopping-basket-01',
    ]);
  });

  it('marks OAuth, AI and cart icons as deferred for First MVP', () => {
    expect(figmaDeferredIconNames).toEqual([
      'google',
      'ai-magic',
      'shopping-basket-01',
    ]);
  });
});
