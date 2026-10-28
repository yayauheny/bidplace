import { describe, expect, it } from 'vitest';

import { designTokens } from '@bidplace/design-tokens';

import { workGalleryShowsArrows } from './work-gallery-arrows';

describe('workGalleryShowsArrows', () => {
  it('hides prev/next on the phone-width gallery', () => {
    expect(workGalleryShowsArrows(designTokens.layout.cardWidth)).toBe(false);
    expect(workGalleryShowsArrows(designTokens.layout.cardWidth - 1)).toBe(
      false,
    );
  });

  it('keeps prev/next when the gallery is wider than phone', () => {
    expect(workGalleryShowsArrows(designTokens.layout.cardWidth + 1)).toBe(
      true,
    );
  });
});
