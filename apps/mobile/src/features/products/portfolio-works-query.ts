import type { PortfolioWorksQuery } from '@bidplace/contracts';

export type PortfolioCatalogSort = Extract<
  PortfolioWorksQuery['sort'],
  'newest' | 'oldest'
>;

export function toPortfolioWorksListQuery(input: {
  q?: string;
  category?: string;
  material?: string;
  sort?: string;
}): Pick<PortfolioWorksQuery, 'q' | 'category' | 'materials' | 'sort'> {
  return {
    ...(input.q ? { q: input.q } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.material ? { materials: [input.material] } : {}),
    sort: input.sort === 'oldest' ? 'oldest' : 'newest',
  };
}
