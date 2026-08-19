import { useLocalSearchParams } from 'expo-router';
import { RegisterForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout';
export default function RegisterScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  return (
    <AuthViewport>
      <RegisterForm redirectTo={getSafeRedirect(redirectTo)} />
    </AuthViewport>
  );
}
