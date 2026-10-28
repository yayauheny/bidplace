import { useLocalSearchParams } from 'expo-router';
import { AppText } from '../../components/ui';
import { LoginForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout';
export default function LoginScreen() {
  const { redirectTo, authError } = useLocalSearchParams<{
    redirectTo?: string | string[];
    authError?: string;
  }>();
  return (
    <AuthViewport
      title="Вход на Bidplace"
      redirectTo={getSafeRedirect(redirectTo)}
    >
      {authError ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {authError === 'link_required'
            ? 'Эта почта уже зарегистрирована. Войдите в существующий аккаунт и подключите провайдера в настройках.'
            : authError === 'cancelled'
              ? 'Вход у провайдера отменён. Можно попробовать снова.'
              : 'Не удалось подтвердить вход. Начните попытку заново.'}
        </AppText>
      ) : null}
      <LoginForm redirectTo={getSafeRedirect(redirectTo)} />
    </AuthViewport>
  );
}
