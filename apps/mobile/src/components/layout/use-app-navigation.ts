import {
  useGlobalSearchParams,
  usePathname,
  useRouter,
  useSegments,
} from 'expo-router';
import { Platform } from 'react-native';

import { getRouteSearchRedirect } from '../../features/auth/auth-redirect';
import { useSearchOverlay } from '../../features/search/search-overlay-provider';
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
  const search = useSearchOverlay();
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
    search,
    isAdmin: auth.isAdmin,
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
