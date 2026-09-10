import { describe, expect, it } from 'vitest';

import {
  parseWorkTabParam,
  relatedWorksExcludingCurrent,
  shouldDropWorkTabParam,
} from './work-screen-composition';

describe('work screen composition', () => {
  it('keeps story tab when the work has a story', () => {
    expect(shouldDropWorkTabParam('story', true)).toBe(false);
    expect(parseWorkTabParam('story')).toBe('story');
  });

  it('drops story tab when the work has no story', () => {
    expect(shouldDropWorkTabParam('story', false)).toBe(true);
    expect(parseWorkTabParam('story')).toBe('story');
  });

  it('does not drop tab when it is absent', () => {
    expect(shouldDropWorkTabParam(undefined, false)).toBe(false);
    expect(shouldDropWorkTabParam(undefined, true)).toBe(false);
    expect(parseWorkTabParam(undefined)).toBe('details');
  });

  it('drops unknown tab values', () => {
    expect(shouldDropWorkTabParam('bids', true)).toBe(true);
    expect(shouldDropWorkTabParam(['story', 'details'], false)).toBe(true);
    expect(parseWorkTabParam('bids')).toBe('details');
    expect(parseWorkTabParam('details')).toBe('details');
  });

  it('excludes the current work from related works', () => {
    expect(relatedWorksExcludingCurrent(
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
