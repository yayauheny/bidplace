import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { exploreHref, parseExploreRoute } from './explore-route';
import { firstSearchParam } from '../discovery/catalog-query';

export function LegacySearchRedirect() {
  const params = useGlobalSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pending = useRef<{
    origin: string;
    href: ReturnType<typeof exploreHref>;
  } | null>(null);
  useEffect(() => {
    if (pathname === '/search' || /^\/(works|authors)(\/|$)/.test(pathname))
      return;
    if (firstSearchParam(params.overlay) === 'search') {
      pending.current = {
        origin: pathname,
        href: exploreHref(
          parseExploreRoute({
            section: firstSearchParam(params.otab) ?? 'categories',
            q: params.oq,
            search: '1',
          }),
        ),
      };
      router.setParams({ overlay: undefined, oq: undefined, otab: undefined });
      return;
    }
    if (pending.current?.origin !== pathname) return;
    const target = pending.current.href;
    let frame: number;
    // Expo linking commits alias replacements after React navigation effects.
    const pushAfterOriginCommit = () => {
      if (
        Platform.OS === 'web' &&
        (window.location.pathname !== pathname ||
          new URLSearchParams(window.location.search).has('overlay'))
      ) {
        frame = requestAnimationFrame(pushAfterOriginCommit);
        return;
      }
      pending.current = null;
      router.push(target);
    };
    frame = requestAnimationFrame(pushAfterOriginCommit);
    return () => cancelAnimationFrame(frame);
  }, [params, pathname, router]);
  return null;
}
