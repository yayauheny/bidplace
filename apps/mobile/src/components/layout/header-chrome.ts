import type { Href } from 'expo-router';
import type { SellerStatus } from '@bidplace/contracts';

export function getMobileCreateHref({
  isAuthenticated,
  sellerStatus,
  returnPath,
}: {
  isAuthenticated: boolean;
  sellerStatus: SellerStatus | null;
  returnPath?: string | null;
}): Href {
  const redirectTo = returnPath?.trim() ? returnPath : '/';
  if (!isAuthenticated) {
    return {
      pathname: '/login',
      params: { redirectTo },
    } as Href;
  }

  return (sellerStatus === 'APPROVED' ? '/products/new' : '/profile') as Href;
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
