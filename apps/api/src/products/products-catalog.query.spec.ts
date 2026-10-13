import { describe, expect, it } from 'vitest';

import { portfolioCatalogCte } from './products-catalog.query';

const sculpture = '10000000-0000-4000-8000-000000000099';
const painting = '10000000-0000-4000-8000-000000000098';

describe('portfolio catalog category filters', () => {
  it('filters multiple categories in SQL before page/count selection', () => {
    const cte = portfolioCatalogCte({
      page: 1,
      limit: 20,
      sort: 'newest',
      categories: [sculpture, painting],
    });

    expect(cte.sql).toContain('published."category_id" IN');
    expect(cte.values).toContain(sculpture);
    expect(cte.values).toContain(painting);
  });

  it('preserves legacy single-category filtering', () => {
    const cte = portfolioCatalogCte({
      page: 1,
      limit: 20,
      sort: 'newest',
      category: sculpture,
    });

    expect(cte.sql).toContain('published."category_id" = CAST');
    expect(cte.values).toContain(sculpture);
  });
});
