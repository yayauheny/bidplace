import { useLocalSearchParams } from 'expo-router';
import { LoginForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout/AuthViewport';
export default function LoginScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return (
    <AuthViewport>
      <LoginForm redirectTo={getSafeRedirect(redirectTo)} />
    </AuthViewport>
  );
}
