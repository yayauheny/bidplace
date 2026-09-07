import { AppShell } from '../../components/layout';
import { PageState } from '../../components/ui';

export function CommerceUnavailableScreen() {
  return (
    <AppShell>
      <PageState
        title="Раздел недоступен"
        message="Эта возможность появится после первого запуска портфолио."
      />
    </AppShell>
  );
}
