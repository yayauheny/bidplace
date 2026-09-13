import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_AUTHOR_APPLICATION,
  ACCOUNT_BECOME_AUTHOR,
  AUTHORS_CATALOG_INTRO,
  RESET_PASSWORD_SUCCESS_DESCRIPTION,
  WORKS_CATALOG_INTRO,
} from './portfolio-copy';

const COMMERCE_LEXICON =
  /покупа|ставк|аукцион|\bлот\b|торг|продавц/i;

describe('portfolio public copy', () => {
  it('keeps discovery and account strings free of commerce lexicon', () => {
    const strings = [
      WORKS_CATALOG_INTRO,
      AUTHORS_CATALOG_INTRO,
      ACCOUNT_BECOME_AUTHOR,
      ACCOUNT_AUTHOR_APPLICATION,
      RESET_PASSWORD_SUCCESS_DESCRIPTION,
    ];

    for (const value of strings) {
      expect(value, value).not.toMatch(COMMERCE_LEXICON);
    }
  });
});
