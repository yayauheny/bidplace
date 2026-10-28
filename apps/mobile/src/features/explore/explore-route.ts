import {
  firstSearchParam,
  optionalRouteText,
  type SearchParam,
} from '../discovery/catalog-query';
import {
  toPortfolioWorksRouteState,
  type PortfolioWorksRouteState,
} from '../products/portfolio-works-query';
import {
  toPortfolioAuthorsRouteState,
  type PortfolioAuthorsRouteState,
} from '../sellers/portfolio-authors-query';

export const exploreSections = [
  { value: 'categories', label: 'Категории' },
  { value: 'authors', label: 'Авторы' },
  { value: 'works', label: 'Работы' },
] as const;
export type ExploreSection = (typeof exploreSections)[number]['value'];
export type ExploreParams = Record<string, SearchParam>;
export type ExploreRoute = {
  section: ExploreSection;
  searchOpen: boolean;
  works: PortfolioWorksRouteState;
  authors: PortfolioAuthorsRouteState;
  categories: { q?: string };
};
export function isExploreSection(value?: string): value is ExploreSection {
  return exploreSections.some((item) => item.value === value);
}
export function parseExploreRoute(params: ExploreParams): ExploreRoute {
  const requested = firstSearchParam(params.section);
  const section = isExploreSection(requested) ? requested : 'works';
  return {
    section,
    searchOpen: firstSearchParam(params.search) === '1',
    works: toPortfolioWorksRouteState(section === 'works' ? params : {}),
    authors: toPortfolioAuthorsRouteState(section === 'authors' ? params : {}),
    categories:
      section === 'categories'
        ? optionalRouteText('q', firstSearchParam(params.q), 120)
        : {},
  };
}
export function exploreParams(state: ExploreRoute) {
  const active = state[state.section];
  return {
    section: state.section,
    search: state.searchOpen ? '1' : undefined,
    q: active.q?.trim() || undefined,
    category: state.section === 'works' ? state.works.category : undefined,
    material: state.section === 'works' ? state.works.material : undefined,
    tag: state.section === 'authors' ? state.authors.tag : undefined,
    city: state.section === 'authors' ? state.authors.city : undefined,
    sort:
      state.section === 'categories' ? undefined : state[state.section].sort,
  };
}
export function exploreHref(state: ExploreRoute): `/explore?${string}` {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(exploreParams(state))) {
    if (value) query.set(key, value);
  }
  return `/explore?${query.toString()}`;
}
export function legacyExploreHref(
  path: 'works' | 'authors' | 'search',
  params: ExploreParams,
) {
  const section =
    path === 'search' ? (firstSearchParam(params.otab) ?? 'categories') : path;
  const href = exploreHref(
    parseExploreRoute({
      ...params,
      section,
      search: path === 'search' || firstSearchParam(params.q) ? '1' : undefined,
    }),
  );
  if (path !== 'search' && firstSearchParam(params.overlay) === 'search') {
    const overlay = new URLSearchParams({
      overlay: 'search',
      oq: firstSearchParam(params.oq) ?? '',
      otab: firstSearchParam(params.otab) ?? 'categories',
    });
    return `${href}&${overlay.toString()}` as `/explore?${string}`;
  }
  return href;
}
export function closeExploreSearch(state: ExploreRoute): ExploreRoute {
  return {
    ...state,
    searchOpen: false,
    [state.section]: { ...state[state.section], q: undefined },
  };
}
