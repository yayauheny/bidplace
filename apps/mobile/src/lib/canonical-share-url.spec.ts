import { describe, expect, it } from 'vitest';

import { canonicalShareUrl } from './canonical-share-url';

describe('canonicalShareUrl', () => {
  it('joins a server sharePath with the current origin', () => {
    expect(
      canonicalShareUrl('/works/portfolio01', 'https://bidplace.test', () => {
        throw new Error('native share path should not be used on web');
      }),
    ).toBe('https://bidplace.test/works/portfolio01');
  });

  it('uses the native URL factory when no origin is available', () => {
    expect(
      canonicalShareUrl('/authors/anna-morozova', undefined, (path) =>
        `bidplace:/${path}`,
      ),
    ).toBe('bidplace://authors/anna-morozova');
  });
});
