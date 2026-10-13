import { uuidSchema } from '@bidplace/contracts';

import { firstSearchParam, type SearchParam } from '../discovery/catalog-query';

export type PublicAuthorRouteState = {
  sort: 'newest' | 'oldest';
  category?: string;
  categories?: string[];
};

export function toPublicAuthorRouteState(input: {
  sort?: SearchParam;
  category?: SearchParam;
  categories?: SearchParam;
}): PublicAuthorRouteState {
  const category = uuidSchema.safeParse(firstSearchParam(input.category));
  const values = firstSearchParam(input.categories)?.split(',');
  const categories = uuidSchema.array().min(1).max(20).safeParse(values);

  return {
    sort: firstSearchParam(input.sort) === 'oldest' ? 'oldest' : 'newest',
    ...(categories.success
      ? { categories: [...new Set(categories.data)] }
      : category.success ? { category: category.data } : {}),
  };
}
