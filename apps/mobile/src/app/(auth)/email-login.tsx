import { useLocalSearchParams } from 'expo-router';
import { AuthViewport } from '../../components/layout';
import { EmailLoginForm } from '../../features/auth/email-login-form';
import { getSafeRedirect } from '../../features/auth/auth-redirect';
export default function EmailLoginScreen() {
  const { redirectTo } = useLocalSearchParams<{
    redirectTo?: string | string[];
  }>();
  const destination = getSafeRedirect(redirectTo);
  return (
    <AuthViewport
      title="Вход по коду"
      redirectTo={destination}
      protectEnteredData
      exit={{
        title: 'Прервать вход',
        description: 'Вы сможете запросить код снова.',
      }}
    >
      <EmailLoginForm redirectTo={destination} />
    </AuthViewport>
  );
}
