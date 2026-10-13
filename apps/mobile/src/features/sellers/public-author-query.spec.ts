import { describe, expect, it } from 'vitest';

import { toPublicAuthorRouteState } from './public-author-query';
import { authorWorksArePending } from './public-author-works-state';
import {
  canReusePreviousAuthorData,
  publicAuthorKeys,
} from './use-author-works';

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

  it('keeps two valid category IDs and rejects invalid lists', () => {
    const first = 'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb';
    const second = 'aedd3848-8f62-44b2-8cf8-977c78d0f96b';
    expect(toPublicAuthorRouteState({ categories: `${first},${second},${first}` }))
      .toEqual({ sort: 'newest', categories: [first, second] });
    expect(toPublicAuthorRouteState({ categories: `${first},invalid` }))
      .toEqual({ sort: 'newest' });
    expect(publicAuthorKeys.detail('anna', 'newest', undefined, [first, second]))
      .toEqual(['public-author', 'anna', {
        sort: 'newest',
        category: undefined,
        categories: [first, second],
      }]);
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

  it('reuses a previous category result only for the same Author', () => {
    expect(
      canReusePreviousAuthorData(
        {
          queryKey: publicAuthorKeys.detail(
            'anna',
            'newest',
            'dc4be8c7-bf43-4c1f-94a3-81802ca0cbbb',
          ),
        },
        'anna',
      ),
    ).toBe(true);
  });

  it('reuses a previous sort result only for the same Author', () => {
    expect(
      canReusePreviousAuthorData(
        { queryKey: publicAuthorKeys.detail('anna', 'oldest') },
        'anna',
      ),
    ).toBe(true);
  });

  it('never reuses a different Author or missing previous query', () => {
    expect(
      canReusePreviousAuthorData(
        { queryKey: publicAuthorKeys.detail('anna', 'newest') },
        'boris',
      ),
    ).toBe(false);
    expect(canReusePreviousAuthorData(undefined, 'boris')).toBe(false);
  });

  it('keeps author metadata available while hiding a previous category projection', () => {
    expect(
      authorWorksArePending({ isLoading: false, isPlaceholderData: true }),
    ).toBe(true);
    expect(
      authorWorksArePending({ isLoading: true, isPlaceholderData: false }),
    ).toBe(true);
    expect(
      authorWorksArePending({ isLoading: false, isPlaceholderData: false }),
    ).toBe(false);
  });
});
