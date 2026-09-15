import { describe, expect, it } from 'vitest';

import { authorPageWebBleed } from './author-page-bleed-style';

describe('author page bleed', () => {
  it('breaks the web author page out of the 390 AppShell column', () => {
    expect(authorPageWebBleed).toEqual({
      width: '100vw',
      marginLeft: 'calc(50% - 50vw)',
    });
  });
});
