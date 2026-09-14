import { describe, expect, it } from 'vitest';

import {
  toPortfolioWorksListQuery,
  toPortfolioWorksRouteState,
} from '../products/portfolio-works-query';
import {
  toPortfolioAuthorsListQuery,
  toPortfolioAuthorsRouteState,
} from '../sellers/portfolio-authors-query';
import {
  nextCatalogPage,
  uniqueCatalogItems,
} from './catalog-pagination';
import { AUTHOR_SORT_OPTIONS } from '../sellers/author-sort';

describe('catalog URL query mappers', () => {
  it('normalizes works params and rejects invalid UUID filters', () => {
    const state = toPortfolioWorksRouteState({
      q: ['  clay  ', 'ignored'],
      category: 'not-a-uuid',
      material: '  Холст ',
      sort: 'oldest',
    });
    expect(state).toEqual({
      q: 'clay',
      material: 'Холст',
      sort: 'oldest',
    });
    expect(toPortfolioWorksListQuery(state)).toEqual({
      q: 'clay',
      materials: ['Холст'],
      sort: 'oldest',
    });
  });

  it('normalizes author params into a strict API query', () => {
    const state = toPortfolioAuthorsRouteState({
      q: '  Анна ',
      tag: ' Живопись ',
      city: ' Минск ',
      sort: 'unknown',
    });
    expect(state).toEqual({
      q: 'Анна',
      tag: 'Живопись',
      city: 'Минск',
      sort: 'added',
    });
    expect(toPortfolioAuthorsListQuery(state)).toEqual({
      q: 'Анна',
      tag: 'Живопись',
      city: 'Минск',
      sort: 'added',
    });
  });

  it('exposes RFC date-added semantics on the authors sort option', () => {
    expect(AUTHOR_SORT_OPTIONS).toEqual([
      { value: 'added', label: 'По дате добавления' },
      { value: 'name', label: 'По имени' },
    ]);
  });
});

describe('catalog pagination', () => {
  it('derives the next server page and stops at total', () => {
    expect(nextCatalogPage({ page: 1, limit: 12, total: 13 })).toBe(2);
    expect(nextCatalogPage({ page: 2, limit: 12, total: 13 })).toBeUndefined();
  });

  it('keeps the first occurrence when pages overlap', () => {
    expect(
      uniqueCatalogItems(
        [{ id: 'one' }, { id: 'two' }, { id: 'one' }],
        (item) => item.id,
      ),
    ).toEqual([{ id: 'one' }, { id: 'two' }]);
  });
});
