import { uuidSchema } from '@bidplace/contracts';

import { firstSearchParam, type SearchParam } from '../discovery/catalog-query';

export type PublicAuthorRouteState = {
  sort: 'newest' | 'oldest';
  category?: string;
};

export function toPublicAuthorRouteState(input: {
  sort?: SearchParam;
  category?: SearchParam;
}): PublicAuthorRouteState {
  const category = uuidSchema.safeParse(firstSearchParam(input.category));

  return {
    sort: firstSearchParam(input.sort) === 'oldest' ? 'oldest' : 'newest',
    ...(category.success ? { category: category.data } : {}),
  };
}
