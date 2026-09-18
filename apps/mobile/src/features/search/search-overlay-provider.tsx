import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
} from 'expo-router';

import { navigateBack } from '../../components/layout/navigate-back';
import { type SearchParam } from '../discovery/catalog-query';
import { SEARCH_OVERLAY_DEFAULT_TAB } from './search-overlay-tabs';
import {
  parseSearchOverlayRoute,
  searchOverlayCloseFallbackHref,
  searchOverlayHref,
  type SearchOverlayRouteState,
  type SearchOverlaySession,
} from './search-overlay-route';

type SearchOverlayContextValue = {
  isOpen: boolean;
  state: SearchOverlayRouteState;
  open: () => void;
  close: () => void;
  replaceSession: (session: SearchOverlaySession) => void;
};

const SearchOverlayContext = createContext<SearchOverlayContextValue | null>(
  null,
);

export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useGlobalSearchParams() as Record<string, SearchParam>;
  const state = parseSearchOverlayRoute(pathname, params);

  const open = useCallback(() => {
    if (state.open) return;
    router.push(
      searchOverlayHref(pathname, params, {
        query: '',
        tab: SEARCH_OVERLAY_DEFAULT_TAB,
      }),
    );
  }, [params, pathname, router, state.open]);

  const close = useCallback(() => {
    if (!state.open) return;
    navigateBack(router, {
      fallbackHref: searchOverlayCloseFallbackHref(pathname, params),
    });
  }, [params, pathname, router, state.open]);

  const replaceSession = useCallback(
    (session: SearchOverlaySession) => {
      if (!state.open) return;
      const href = searchOverlayHref(pathname, params, session);
      const current = searchOverlayHref(pathname, params, {
        query: state.query,
        tab: state.tab,
      });
      if (href === current) return;
      router.replace(href);
    },
    [params, pathname, router, state.open, state.query, state.tab],
  );

  const value = useMemo(
    () => ({
      isOpen: state.open,
      state,
      open,
      close,
      replaceSession,
    }),
    [close, open, replaceSession, state],
  );

  return (
    <SearchOverlayContext.Provider value={value}>
      {children}
    </SearchOverlayContext.Provider>
  );
}

export function useSearchOverlay(): SearchOverlayContextValue {
  const context = useContext(SearchOverlayContext);
  if (!context) {
    throw new Error('useSearchOverlay must be used within SearchOverlayProvider');
  }
  return context;
}
