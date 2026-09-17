import { Redirect } from 'expo-router';
import { useState, type ReactNode } from 'react';

import { AppShell } from '../layout';
import { InfrastructurePageStatus } from './InfrastructurePageStatus';
import { useAuth } from '../../providers/auth-provider';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const auth = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const pageStatus = !auth.ready || refreshing
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

  if (!auth.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (requireAdmin && !auth.canModerate) {
    return <Redirect href="/" />;
  }

  return children;
}
