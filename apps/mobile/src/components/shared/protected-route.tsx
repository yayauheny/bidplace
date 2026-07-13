import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { LoadingState } from '../ui';
import { useAuth } from '../../providers/auth-provider';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const auth = useAuth();

  if (!auth.ready) {
    return <LoadingState label="Проверяем доступ" />;
  }

  if (!auth.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (requireAdmin && !auth.canModerate) {
    return <Redirect href="/" />;
  }

  return children;
}
