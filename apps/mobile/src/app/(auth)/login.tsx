import { useLocalSearchParams } from 'expo-router';
import { LoginForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout';
export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return (
    <AuthViewport
      title="Вход на Bidplace"
      redirectTo={getSafeRedirect(redirectTo)}
    >
      <LoginForm redirectTo={getSafeRedirect(redirectTo)} />
    </AuthViewport>
  );
}
