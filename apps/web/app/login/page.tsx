import { LoginForm } from '../../src/features/auth/auth-form';
import { PageContainer } from '../../src/components/ui/layout';

export default function LoginPage() {
  return (
    <PageContainer>
      <LoginForm redirectTo="/" />
    </PageContainer>
  );
}
