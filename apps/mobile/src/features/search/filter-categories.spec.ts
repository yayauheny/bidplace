import { describe, expect, it } from 'vitest';

import { filterCategoriesByQuery } from './filter-categories';

const categories = [
  { id: '1', slug: 'art-object', name: 'Авторские работы' },
  { id: '2', slug: 'ceramics', name: 'Керамика' },
];

describe('filterCategoriesByQuery', () => {
  it('returns the full list for an empty or whitespace query', () => {
    expect(filterCategoriesByQuery(categories, '')).toEqual(categories);
    expect(filterCategoriesByQuery(categories, '   ')).toEqual(categories);
  });

  it('matches name case-insensitively', () => {
    expect(filterCategoriesByQuery(categories, 'АВТОРСКИЕ')).toEqual([
      categories[0],
    ]);
  });

  it('matches slug case-insensitively', () => {
    expect(filterCategoriesByQuery(categories, 'Art-Object')).toEqual([
      categories[0],
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterCategoriesByQuery(categories, 'живопись')).toEqual([]);
  });
});
