import { useLocalSearchParams } from 'expo-router';

import { AuthViewport } from '../../components/layout';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { ForgotPasswordForm } from '../../features/auth/forgot-password-form';

export default function ForgotPasswordScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();

  const safeRedirect = getSafeRedirect(redirectTo);
  return (
    <AuthViewport
      title="Восстановление пароля"
      tone="section"
      redirectTo={safeRedirect}
      exit={{
        title: 'Прервать восстановление',
        description: 'Ссылка не отправляется, если уйти до завершения запроса.',
      }}
    >
      <ForgotPasswordForm redirectTo={safeRedirect} />
    </AuthViewport>
  );
}
