import { describe, expect, it } from 'vitest';

import { orderedWorkGalleryImages } from './work-gallery';

describe('work gallery', () => {
  it('preserves server order by position', () => {
    expect(
      orderedWorkGalleryImages([
        { id: 'b', url: '/b', position: 1 },
        { id: 'a', url: '/a', position: 0 },
      ]).map((image) => image.id),
    ).toEqual(['a', 'b']);
  });

  it('keeps an empty list empty', () => {
    expect(orderedWorkGalleryImages([])).toEqual([]);
  });
});
