import type { Href } from 'expo-router';
import type { SellerStatus } from '@bidplace/contracts';

export function isAuthorsRoute(pathname: string): boolean {
  return pathname === '/authors' || pathname.startsWith('/authors/');
}

export function getDiscoveryLabel(
  pathname: string,
): 'Авторы' | 'Работы' {
  return isAuthorsRoute(pathname) ? 'Авторы' : 'Работы';
}

export function getHeaderSearchPlaceholder(pathname: string): string {
  const authorsRoute = isAuthorsRoute(pathname);
  const worksRoute =
    pathname === '/works' || pathname.startsWith('/works/');

  return worksRoute || authorsRoute
    ? 'Найти работу или автора'
    : 'Найти предмет или автора';
}

export function canShowDesktopCreateListing({
  isAdmin,
  sellerStatus,
}: {
  isAdmin: boolean;
  sellerStatus: SellerStatus | null;
}): boolean {
  return !isAdmin && sellerStatus === 'APPROVED';
}

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

  return (sellerStatus === 'APPROVED'
    ? '/products/new'
    : '/profile') as Href;
}

export function submitHeaderSearch(
  router: { push: (href: Href) => void },
  query: string,
) {
  const value = query.trim();
  if (!value) return;
  router.push({ pathname: '/search', params: { q: value } } as Href);
}

export function logoutAndGoHome(
  auth: { logout: () => Promise<void> },
  router: { replace: (href: Href) => void },
) {
  return auth.logout().then(() => router.replace('/'));
}
