import { useLocalSearchParams } from 'expo-router';

import { AuthViewport } from '../../components/layout';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { ForgotPasswordForm } from '../../features/auth/forgot-password-form';

export default function ForgotPasswordScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();

  return (
    <AuthViewport>
      <ForgotPasswordForm redirectTo={getSafeRedirect(redirectTo)} />
    </AuthViewport>
  );
}
