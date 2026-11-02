import type { Href } from 'expo-router';
import type { SellerStatus } from '@bidplace/contracts';
import {
  authorProfileDestination,
  type SellerProfileAvailability,
} from '../../hooks/use-seller-capability';

export function getMobileCreateHref({
  isAuthenticated,
  sellerStatus,
  sellerState,
  returnPath,
}: {
  isAuthenticated: boolean;
  sellerStatus: SellerStatus | null;
  sellerState?: SellerProfileAvailability;
  returnPath?: string | null;
}): Href {
  const redirectTo = returnPath?.trim() ? returnPath : '/';
  if (!isAuthenticated) {
    return {
      pathname: '/login',
      params: { redirectTo },
    } as Href;
  }

  const destination = authorProfileDestination(sellerStatus, sellerState);
  return sellerStatus === 'APPROVED' && destination === '/cabinet'
    ? '/products/new'
    : destination;
}

export function getProfileHref({
  isAdmin,
  isAuthenticated,
  returnPath,
}: {
  isAdmin: boolean;
  isAuthenticated: boolean;
  returnPath: string;
}): Href {
  if (isAdmin) return '/account';
  if (isAuthenticated) return '/account';
  return returnPath === '/'
    ? '/login'
    : { pathname: '/login', params: { redirectTo: returnPath } };
}

// Founder-approved adaptation of the 1800px Figma header.
export function hasDesktopNavigation(
  platform: string,
  width: number,
  isPublic: boolean,
) {
  return isPublic && platform === 'web' && width >= 1024;
}
