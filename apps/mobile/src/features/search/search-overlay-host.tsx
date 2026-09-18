import { useEffect, useRef, useState } from 'react';
import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
} from 'expo-router';

import {
  firstSearchParam,
  optionalRouteText,
} from '../discovery/catalog-query';
import { SearchOverlay } from './SearchOverlay';
import { useSearchOverlay } from './search-overlay-provider';

function isSearchPath(pathname: string) {
  return pathname === '/search' || pathname.startsWith('/search/');
}

export function SearchOverlayHost() {
  const { isOpen, initialQuery, sessionKey, close } = useSearchOverlay();
  const pathname = usePathname();
  const router = useRouter();
  const params = useGlobalSearchParams<{ q?: string | string[] }>();
  const routeQuery =
    optionalRouteText('q', firstSearchParam(params.q), 120).q ?? '';
  const onSearchRoute = isSearchPath(pathname);
  const [searchRouteDismissed, setSearchRouteDismissed] = useState(false);
  const openedOnPath = useRef(pathname);

  useEffect(() => {
    if (openedOnPath.current === pathname) return;
    openedOnPath.current = pathname;
    close();
    if (!isSearchPath(pathname)) {
      setSearchRouteDismissed(false);
    }
  }, [close, pathname]);

  const visible = isOpen || (onSearchRoute && !searchRouteDismissed);

  const dismiss = () => {
    close();
    if (!onSearchRoute) return;
    setSearchRouteDismissed(true);
    router.replace('/');
  };

  const select = () => {
    close();
    if (onSearchRoute) {
      setSearchRouteDismissed(true);
    }
  };

  if (!visible) return null;

  return (
    <SearchOverlay
      key={isOpen ? String(sessionKey) : `route:${routeQuery}`}
      initialQuery={isOpen ? initialQuery : routeQuery}
      onDismiss={dismiss}
      onSelect={select}
    />
  );
}
