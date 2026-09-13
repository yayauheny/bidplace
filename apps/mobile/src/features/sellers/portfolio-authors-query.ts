import type { PortfolioAuthorsQuery } from '@bidplace/contracts';

import {
  firstSearchParam,
  optionalRouteText,
  type SearchParam,
} from '../discovery/catalog-query';

export type PortfolioAuthorsRouteState = {
  q?: string;
  tag?: string;
  city?: string;
  sort: PortfolioAuthorsQuery['sort'];
};

export const AUTHORS_PAGE_SIZE = 8;

export function toPortfolioAuthorsRouteState(input: {
  q?: SearchParam;
  tag?: SearchParam;
  city?: SearchParam;
  sort?: SearchParam;
}): PortfolioAuthorsRouteState {
  return {
    ...optionalRouteText('q', firstSearchParam(input.q), 120),
    ...optionalRouteText('tag', firstSearchParam(input.tag), 160),
    ...optionalRouteText('city', firstSearchParam(input.city), 160),
    sort: firstSearchParam(input.sort) === 'name' ? 'name' : 'added',
  };
}

export function toPortfolioAuthorsListQuery(
  input: PortfolioAuthorsRouteState,
): Pick<PortfolioAuthorsQuery, 'q' | 'tag' | 'city' | 'sort'> {
  return {
    ...(input.q ? { q: input.q } : {}),
    ...(input.tag ? { tag: input.tag } : {}),
    ...(input.city ? { city: input.city } : {}),
    sort: input.sort,
  };
}
