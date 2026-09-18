import { describe, expect, it } from 'vitest';

import {
  toPortfolioWorksHref,
  toPortfolioWorksListQuery,
} from './portfolio-works-query';

describe('portfolio works list query', () => {
  it('sends only RFC filters to listWorks', () => {
    expect(
      toPortfolioWorksListQuery({
        q: 'clay',
        category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        material: 'Clay',
        sort: 'activity',
      }),
    ).toEqual({
      q: 'clay',
      category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      materials: ['Clay'],
      sort: 'newest',
    });
    expect(toPortfolioWorksListQuery({ sort: 'oldest' })).toEqual({
      sort: 'oldest',
    });
    expect(toPortfolioWorksListQuery({ sort: 'priceAsc' })).not.toHaveProperty(
      'status',
    );
    expect(toPortfolioWorksListQuery({ sort: 'priceAsc' })).not.toHaveProperty(
      'priceMin',
    );
  });

  it('builds the canonical Works catalog href from category id', () => {
    expect(toPortfolioWorksHref({})).toBe('/works');
    expect(
      toPortfolioWorksHref({
        category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
      }),
    ).toBe('/works?category=3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1');
    expect(toPortfolioWorksHref({ sort: 'newest' })).toBe('/works');
  });
});
