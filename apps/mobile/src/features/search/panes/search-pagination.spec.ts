import { describe, expect, it } from 'vitest';

import { searchPaginationView } from './search-pagination';

describe('search result pagination', () => {
  it('keeps loaded results while the next page is fetched', () => {
    const items = [{ id: 'first' }, { id: 'second' }];

    expect(
      searchPaginationView({
        items,
        hasNextPage: true,
        isFetchingNextPage: true,
      }),
    ).toEqual({
      items,
      nextPage: { label: 'Показать ещё', loading: true },
    });
  });

  it('shows the same explicit action for Works and Authors only when another page exists', () => {
    for (const items of [[{ id: 'work' }], [{ id: 'author' }]]) {
      expect(
        searchPaginationView({
          items,
          hasNextPage: true,
          isFetchingNextPage: false,
        }).nextPage,
      ).toEqual({ label: 'Показать ещё', loading: false });
      expect(
        searchPaginationView({
          items,
          hasNextPage: false,
          isFetchingNextPage: false,
        }).nextPage,
      ).toBeNull();
    }
  });
});
