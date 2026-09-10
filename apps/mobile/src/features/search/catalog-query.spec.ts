import { describe, expect, it } from 'vitest';

import {
  authorsCatalogHref,
  catalogHasFilters,
  parseCsvParam,
  parsePageParam,
  worksCatalogHref,
} from './catalog-query';

describe('catalog URL query', () => {
  it('keeps works and authors filters in the URL only', () => {
    expect(
      worksCatalogHref({
        q: 'глина',
        category: '3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1',
        materials: ['холст'],
        sort: 'oldest',
        page: 2,
      }),
    ).toBe(
      '/works?q=%D0%B3%D0%BB%D0%B8%D0%BD%D0%B0&category=3c03a90b-4e8e-4a3c-8f5f-7cf4f7f3d7d1&materials=%D1%85%D0%BE%D0%BB%D1%81%D1%82&sort=oldest&page=2',
    );
    expect(authorsCatalogHref({ tag: 'живопись', city: 'Минск', sort: 'name' })).toBe(
      '/authors?tag=%D0%B6%D0%B8%D0%B2%D0%BE%D0%BF%D0%B8%D1%81%D1%8C&city=%D0%9C%D0%B8%D0%BD%D1%81%D0%BA&sort=name',
    );
    expect(parseCsvParam('холст, масло')).toEqual(['холст', 'масло']);
    expect(parsePageParam('3')).toBe(3);
    expect(catalogHasFilters({ q: 'a' })).toBe(true);
    expect(catalogHasFilters({})).toBe(false);
  });
});
