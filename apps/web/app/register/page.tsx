import { RegisterForm } from '../../src/features/auth/auth-form';
import { PageContainer } from '../../src/components/ui/layout';

export default function RegisterPage() {
  return (
    <PageContainer>
      <RegisterForm redirectTo="/" />
    </PageContainer>
  );
}
