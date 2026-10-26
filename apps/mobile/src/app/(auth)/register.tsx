import { useLocalSearchParams } from 'expo-router';
import { RegisterForm } from '../../features/auth/auth-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
import { AuthViewport } from '../../components/layout';
export default function RegisterScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  const safeRedirect = getSafeRedirect(redirectTo);
  return (
    <AuthViewport
      title="Регистрация"
      tone="section"
      presentation="screen"
      protectEnteredData
      exit={{
        title: 'Прервать регистрацию',
        description: 'Аккаунт не создаётся, пока регистрация не завершена.',
      }}
    >
      <RegisterForm redirectTo={safeRedirect} />
    </AuthViewport>
  );
}
