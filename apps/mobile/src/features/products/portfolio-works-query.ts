import {
  uuidSchema,
  type PortfolioWorksQuery,
} from '@bidplace/contracts';

import {
  firstSearchParam,
  optionalRouteText,
  type SearchParam,
} from '../discovery/catalog-query';

export type PortfolioCatalogSort = Extract<
  PortfolioWorksQuery['sort'],
  'newest' | 'oldest'
>;

export type PortfolioWorksRouteState = {
  q?: string;
  category?: string;
  material?: string;
  sort: PortfolioCatalogSort;
};

export const WORKS_PAGE_SIZE = 12;

export function toPortfolioWorksRouteState(input: {
  q?: SearchParam;
  category?: SearchParam;
  material?: SearchParam;
  sort?: SearchParam;
}): PortfolioWorksRouteState {
  const category = uuidSchema.safeParse(firstSearchParam(input.category));
  return {
    ...optionalRouteText('q', firstSearchParam(input.q), 120),
    ...(category.success ? { category: category.data } : {}),
    ...optionalRouteText('material', firstSearchParam(input.material), 80),
    sort: firstSearchParam(input.sort) === 'oldest' ? 'oldest' : 'newest',
  };
}

export function toPortfolioWorksListQuery(
  input: Omit<PortfolioWorksRouteState, 'sort'> & { sort?: string },
): Pick<PortfolioWorksQuery, 'q' | 'category' | 'materials' | 'sort'> {
  return {
    ...(input.q ? { q: input.q } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.material ? { materials: [input.material] } : {}),
    sort: input.sort === 'oldest' ? 'oldest' : 'newest',
  };
}
