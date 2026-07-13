'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../providers/auth-provider';
import { LoadingBlock, ErrorState } from '../ui/states';

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.ready) {
      return;
    }

    if (!auth.isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (requireAdmin && !auth.isAdmin) {
      router.replace('/');
    }
  }, [auth.isAdmin, auth.isAuthenticated, auth.ready, requireAdmin, router]);

  if (!auth.ready) {
    return <LoadingBlock label="Проверяем доступ" />;
  }

  if (!auth.isAuthenticated) {
    return <LoadingBlock label="Перенаправление" />;
  }

  if (requireAdmin && !auth.isAdmin) {
    return (
      <ErrorState
        title="Нет доступа"
        description="Эта область доступна только администраторам."
      />
    );
  }

  return children;
}
