import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText, PageState } from '../ui';
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

  if (!auth.ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: designTokens.color.canvas,
        }}
      >
        <AppText role="bodySmall" tone="secondary">
          Проверяем доступ…
        </AppText>
      </View>
    );
  }

  if (auth.status === 'error') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          backgroundColor: designTokens.color.canvas,
        }}
      >
        <PageState
          title="Не удалось проверить доступ"
          retry={() => void auth.refreshSession()}
        />
      </View>
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
