import {
  Redirect,
  useGlobalSearchParams,
  usePathname,
  useSegments,
  type Href,
} from 'expo-router';
import { useState, type ReactNode } from 'react';

import { AppShell } from '../layout';
import { InfrastructurePageStatus } from './InfrastructurePageStatus';
import { useAuth } from '../../providers/auth-provider';
import { getProtectedRedirect } from '../../features/auth/auth-redirect';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
  requireVerifiedEmail?: boolean;
};

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireVerifiedEmail = false,
}: ProtectedRouteProps) {
  const auth = useAuth();
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const segments = useSegments();
  const [refreshing, setRefreshing] = useState(false);
  const pageStatus =
    !auth.ready || refreshing
      ? 'loading'
      : auth.status === 'error'
        ? 'error'
        : null;

  if (pageStatus) {
    return (
      <AppShell>
        <InfrastructurePageStatus
          status={pageStatus}
          onRetry={() => {
            setRefreshing(true);
            void auth.refreshSession().finally(() => {
              setRefreshing(false);
            });
          }}
        />
      </AppShell>
    );
  }

  const dynamicParamNames = segments.flatMap((segment) => {
    const match = /^\[\.\.\.(.+)\]$|^\[(.+)\]$/.exec(segment);
    return match ? [match[1] ?? match[2]!] : [];
  });
  const redirectTo = getProtectedRedirect(pathname, params, dynamicParamNames);

  if (!auth.isAuthenticated) {
    return <Redirect href={{ pathname: '/login', params: { redirectTo } }} />;
  }

  if (requireVerifiedEmail && !auth.user?.emailVerifiedAt) {
    return (
      <Redirect
        href={`/verify-email?redirectTo=${encodeURIComponent(redirectTo)}` as Href}
      />
    );
  }

  if (requireAdmin && !auth.canModerate) {
    return <Redirect href="/" />;
  }

  return children;
}
