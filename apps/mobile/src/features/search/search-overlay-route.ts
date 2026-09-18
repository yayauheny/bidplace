import type { Href } from 'expo-router';

import {
  firstSearchParam,
  type SearchParam,
} from '../discovery/catalog-query';
import {
  SEARCH_OVERLAY_DEFAULT_TAB,
  isSearchOverlayTab,
  type SearchOverlayTab,
} from './search-overlay-tabs';

export const SEARCH_OVERLAY_PARAM = 'overlay';
export const SEARCH_OVERLAY_VALUE = 'search';
export const SEARCH_OVERLAY_QUERY_PARAM = 'oq';
export const SEARCH_OVERLAY_TAB_PARAM = 'otab';

const SEARCH_OVERLAY_PARAM_KEYS = new Set([
  SEARCH_OVERLAY_PARAM,
  SEARCH_OVERLAY_QUERY_PARAM,
  SEARCH_OVERLAY_TAB_PARAM,
]);

const PATH_PARAM_KEYS = new Set([
  'publicId',
  'id',
  'slug',
  'token',
  'redirectTo',
  'flow',
  'step',
]);

export type SearchOverlayRouteState = {
  open: boolean;
  query: string;
  tab: SearchOverlayTab;
  compatibilityRoute: boolean;
};

export type SearchOverlaySession = {
  query: string;
  tab: SearchOverlayTab;
};

export function isSearchPath(pathname: string) {
  return pathname === '/search' || pathname.startsWith('/search/');
}

export function parseSearchOverlayRoute(
  pathname: string,
  params: Record<string, SearchParam>,
): SearchOverlayRouteState {
  const compatibilityRoute = isSearchPath(pathname);
  const overlay = firstSearchParam(params[SEARCH_OVERLAY_PARAM]);
  const tabValue = firstSearchParam(params[SEARCH_OVERLAY_TAB_PARAM]);
  const tab =
    tabValue && isSearchOverlayTab(tabValue)
      ? tabValue
      : SEARCH_OVERLAY_DEFAULT_TAB;
  const compatibilityQuery = firstSearchParam(params.q) ?? '';
  const overlayQuery = firstSearchParam(params[SEARCH_OVERLAY_QUERY_PARAM]) ?? '';

  return {
    open: compatibilityRoute || overlay === SEARCH_OVERLAY_VALUE,
    query: compatibilityRoute ? compatibilityQuery : overlayQuery,
    tab,
    compatibilityRoute,
  };
}

export function preservedRouteParams(params: Record<string, SearchParam>) {
  const preserved: Record<string, string> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (PATH_PARAM_KEYS.has(key) || SEARCH_OVERLAY_PARAM_KEYS.has(key)) {
      continue;
    }
    const value = firstSearchParam(raw)?.trim();
    if (value) preserved[key] = value;
  }
  return preserved;
}

export function searchOverlayHref(
  pathname: string,
  params: Record<string, SearchParam>,
  overlay: SearchOverlaySession | null,
): Href {
  const next = preservedRouteParams(params);
  const path = normalizePathname(pathname);

  if (overlay && isSearchPath(path)) {
    if (overlay.query) next.q = overlay.query;
    else delete next.q;
    assignOverlayTab(next, overlay.tab);
    return hrefWithQuery('/search', next);
  }

  if (overlay) {
    next[SEARCH_OVERLAY_PARAM] = SEARCH_OVERLAY_VALUE;
    if (overlay.query) next[SEARCH_OVERLAY_QUERY_PARAM] = overlay.query;
    assignOverlayTab(next, overlay.tab);
  }

  return hrefWithQuery(path, next);
}

export function searchOverlayCloseFallbackHref(
  pathname: string,
  params: Record<string, SearchParam>,
): Href {
  if (isSearchPath(pathname)) return '/';
  return searchOverlayHref(pathname, params, null);
}

function assignOverlayTab(
  next: Record<string, string>,
  tab: SearchOverlayTab,
) {
  if (tab === SEARCH_OVERLAY_DEFAULT_TAB) {
    delete next[SEARCH_OVERLAY_TAB_PARAM];
    return;
  }
  next[SEARCH_OVERLAY_TAB_PARAM] = tab;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '') return '/';
  return pathname;
}

function hrefWithQuery(pathname: string, params: Record<string, string>): Href {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }
  const query = search.toString();
  return (query ? `${pathname}?${query}` : pathname) as Href;
}
