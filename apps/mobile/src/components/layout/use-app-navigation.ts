import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router';
import { Platform } from 'react-native';

import { getRouteSearchRedirect } from '../../features/auth/auth-redirect';
import { parseExploreRoute } from '../../features/explore/explore-route';
import { exploreSearchHref } from '../../features/explore/use-explore-state';
import { useSellerCapability } from '../../hooks/use-seller-capability';
import { useAuth } from '../../providers/auth-provider';
import { rememberPendingOpener } from '../ui/use-return-focus';
import { getMobileCreateHref, getProfileHref } from './header-chrome';

export function useAppNavigation(hostTestID: string) {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const segments = useSegments();
  const router = useRouter();
  const auth = useAuth();
  const capability = useSellerCapability();
  const search = {
    isOpen: pathname === '/explore',
    open: () => {
      if (pathname === '/explore') router.setParams({ search: '1' });
      else router.navigate(exploreSearchHref());
    },
  };
  const returnPath = getRouteSearchRedirect(pathname, segments, params);
  const rememberAuthOpener = (label: string) => {
    if (Platform.OS === 'web' && !auth.isAuthenticated && !auth.isAdmin) {
      rememberPendingOpener(
        `[data-testid="${hostTestID}"] [aria-label="${CSS.escape(label)}"]`,
      );
    }
  };

  return {
    pathname,
    section: parseExploreRoute(params).section,
    search,
    isAdmin: auth.isAdmin,
    canModerate: auth.canModerate,
    canReadAnalytics: auth.isAdmin,
    authorHref: getMobileCreateHref({
      isAuthenticated: auth.isAuthenticated,
      sellerStatus: null,
      returnPath: '/profile',
    }),
    profileHref: getProfileHref({ ...auth, returnPath }),
    rememberAuthOpener,
    create: (label: string) => {
      rememberAuthOpener(label);
      router.push(
        getMobileCreateHref({
          isAuthenticated: auth.isAuthenticated,
          sellerStatus: capability.status,
          returnPath,
        }),
      );
    },
  };
}
