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
    <AuthViewport>
      <VerifyEmailForm redirectTo={safeRedirect} autoRequest={safeRedirect !== '/'} />
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
