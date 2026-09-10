import { describe, expect, it } from 'vitest';

import { resolvePublicShareUrl } from './resolve-public-share-url';

describe('public share URL', () => {
  it('resolves a server sharePath against the public origin', () => {
    expect(
      resolvePublicShareUrl('/authors/vex', 'https://bidplace.example'),
    ).toBe('https://bidplace.example/authors/vex');
    expect(
      resolvePublicShareUrl('/works/ABCDEFGHIJK', 'https://bidplace.example'),
    ).toBe('https://bidplace.example/works/ABCDEFGHIJK');
  });
});
