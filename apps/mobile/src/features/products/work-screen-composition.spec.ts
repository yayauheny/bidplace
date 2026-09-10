import { describe, expect, it } from 'vitest';

import {
  parseWorkTabParam,
  relatedWorksExcludingCurrent,
} from './work-screen-composition';

describe('work screen composition', () => {
  it('keeps story tab only when requested and excludes the current work', () => {
    expect(parseWorkTabParam('story')).toBe('story');
    expect(parseWorkTabParam('details')).toBe('details');
    expect(parseWorkTabParam('bids')).toBe('details');
    expect(
      relatedWorksExcludingCurrent(
        [
          {
            work: {
              publicId: 'ABCDEFGHIJK',
              title: 'Current',
              images: [{ url: '/api/images/1' }],
            },
            author: { slug: 'vex' },
          },
          {
            work: {
              publicId: 'OTHERWORK01',
              title: 'Other',
              images: [{ url: '/api/images/2' }],
            },
            author: { slug: 'vex' },
          },
        ],
        'ABCDEFGHIJK',
      ),
    ).toEqual([
      {
        publicId: 'OTHERWORK01',
        title: 'Other',
        imageUrl: '/api/images/2',
        authorSlug: 'vex',
      },
    ]);
  });
});
