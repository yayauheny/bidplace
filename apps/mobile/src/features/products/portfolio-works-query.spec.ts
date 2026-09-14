import { describe, expect, it } from 'vitest';

import { toPortfolioWorksListQuery } from './portfolio-works-query';

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
});
