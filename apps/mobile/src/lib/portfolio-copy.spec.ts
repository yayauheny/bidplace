import { exploreSections } from '../features/explore/explore-route';
import { describe, expect, it } from 'vitest';

import { RESET_PASSWORD_SUCCESS_DESCRIPTION } from './portfolio-copy';

const COMMERCE_LEXICON = /покупа|ставк|аукцион|\bлот\b|торг|продавц/i;

describe('portfolio public copy', () => {
  it('keeps discovery and account strings free of commerce lexicon', () => {
    const strings = [
      ...exploreSections.map((section) => section.label),
      RESET_PASSWORD_SUCCESS_DESCRIPTION,
    ];

    for (const value of strings) {
      expect(value, value).not.toMatch(COMMERCE_LEXICON);
    }
  });
});
