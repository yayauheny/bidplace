import type { PortfolioWorksQuery } from '@bidplace/contracts';

export type PortfolioCatalogSort = Extract<
  PortfolioWorksQuery['sort'],
  'newest' | 'oldest'
>;

export function toPortfolioWorksListQuery(input: {
  q?: string;
  category?: string;
  material?: string;
  materials?: readonly string[];
  sort?: string;
  page?: number;
}): Pick<PortfolioWorksQuery, 'q' | 'category' | 'materials' | 'sort'> & {
  page?: number;
} {
  const materials = [
    ...(input.materials ?? []),
    ...(input.material ? [input.material] : []),
  ];
  return {
    ...(input.q ? { q: input.q } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(materials.length > 0 ? { materials } : {}),
    sort: input.sort === 'oldest' ? 'oldest' : 'newest',
    ...(input.page && input.page > 1 ? { page: input.page } : {}),
  };
}
