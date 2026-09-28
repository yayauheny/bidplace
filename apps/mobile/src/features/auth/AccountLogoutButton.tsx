import { SecondaryButton } from '../../components/ui';
import { useAuth } from '../../providers/auth-provider';
import { useAccountLogout } from './account-logout';

export function AccountLogoutButton({
  onPress,
  pending = false,
  width = 'block',
}: {
  onPress?: () => void;
  pending?: boolean;
  width?: 'content' | 'block';
}) {
  const auth = useAuth();
  const accountLogout = useAccountLogout();
  if (!auth.isAuthenticated) return null;
  const busy = pending || accountLogout.busy;

  return (
    <SecondaryButton
      label="Выйти"
      width={width}
      loading={busy}
      disabled={busy}
      onPress={() => {
        if (busy) return;
        if (onPress) {
          onPress();
          return;
        }
        void accountLogout.logout();
      }}
    />
  );
}
