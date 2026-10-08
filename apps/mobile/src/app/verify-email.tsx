import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

import { AuthViewport } from '../components/layout';
import { ProtectedRoute } from '../components/shared/protected-route';
import { getSafeRedirect } from '../features/auth/auth-redirect';
import { VerifyEmailForm } from '../features/auth/verify-email-form';
import { useAuth } from '../providers/auth-provider';

function VerifyEmailScreen() {
  const auth = useAuth();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string | string[] }>();
  const safeRedirect = getSafeRedirect(redirectTo);

  if (auth.user?.emailVerifiedAt) {
    return <Redirect href={safeRedirect as Href} />;
  }

  return (
    <AuthViewport
      title="Проверьте код на почте"
      tone="section"
      presentation="screen"
      redirectTo="/"
      exit={{
        title: 'Выйти из подтверждения',
        description: 'Подтверждение можно пройти позже. Аккаунт сохранится.',
      }}
    >
      <VerifyEmailForm redirectTo={safeRedirect} autoRequest />
    </AuthViewport>
  );
}

export default function VerifyEmailRoute() {
  return (
    <ProtectedRoute>
      <VerifyEmailScreen />
    </ProtectedRoute>
  );
}
