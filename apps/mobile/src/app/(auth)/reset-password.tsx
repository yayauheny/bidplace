import { useLocalSearchParams } from 'expo-router';

import { AuthViewport } from '../../components/layout';
import { ResetPasswordForm } from '../../features/auth/reset-password-form';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const resolvedToken = Array.isArray(token) ? token[0] : token ?? null;

  return (
    <AuthViewport>
      <ResetPasswordForm token={resolvedToken} />
    </AuthViewport>
  );
}
