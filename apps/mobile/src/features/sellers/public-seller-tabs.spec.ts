import { describe, expect, it } from 'vitest';

import { AUTHOR_PUBLIC_TABS } from './author-public-tabs';

describe('author public tabs', () => {
  it('keeps only Works and About and skips commerce archive tabs', () => {
    expect(AUTHOR_PUBLIC_TABS).toEqual(['works', 'about']);
    expect(AUTHOR_PUBLIC_TABS).not.toContain('archive');
    expect(AUTHOR_PUBLIC_TABS).not.toContain('listings');
  });
});
