import { AuthViewport } from '../../../components/layout';
import { OnboardingForm } from '../../../features/auth/onboarding-form';
export default function CompleteAuthScreen() {
  return (
    <AuthViewport
      title="Завершите регистрацию"
      tone="section"
      presentation="screen"
      protectEnteredData
      exit={{
        title: 'Прервать регистрацию',
        description:
          'Незавершённый аккаунт сохранится. Вход можно будет продолжить через провайдера.',
      }}
    >
      <OnboardingForm />
    </AuthViewport>
  );
}
