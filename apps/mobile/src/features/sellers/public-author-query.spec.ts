import { describe, expect, it } from 'vitest';

import { toPublicAuthorRouteState } from './public-author-query';
import { publicAuthorKeys } from './use-author-works';

describe('public author route state', () => {
  it('keeps only a valid category UUID for the author API query', () => {
    expect(
      toPublicAuthorRouteState({
        sort: 'oldest',
        category: 'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb',
      }),
    ).toEqual({
      sort: 'oldest',
      category: 'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb',
    });

    expect(
      toPublicAuthorRouteState({ sort: 'unexpected', category: 'not-a-uuid' }),
    ).toEqual({ sort: 'newest' });
  });

  it('keeps category in the one public author query identity', () => {
    expect(
      publicAuthorKeys.detail(
        'anna',
        'newest',
        'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb',
      ),
    ).toEqual([
      'public-author',
      'anna',
      {
        sort: 'newest',
        category: 'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb',
      },
    ]);
  });
});
