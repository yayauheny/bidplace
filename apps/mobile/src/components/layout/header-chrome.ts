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

  return (sellerStatus === 'APPROVED'
    ? '/products/new'
    : '/profile') as Href;
}
