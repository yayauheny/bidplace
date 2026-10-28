import { SecondaryButton, TextButton } from '../../components/ui';
import { useAuth } from '../../providers/auth-provider';
import { useAccountLogout } from './account-logout';

export function AccountLogoutButton({
  onPress,
  pending = false,
  width = 'block',
  variant = 'outline',
}: {
  onPress?: () => void;
  pending?: boolean;
  width?: 'content' | 'block';
  variant?: 'outline' | 'ghost';
}) {
  const auth = useAuth();
  const accountLogout = useAccountLogout();
  if (!auth.isAuthenticated) return null;
  const busy = pending || accountLogout.busy;
  const logoutProps = {
    label: 'Выйти',
    width,
    loading: busy,
    disabled: busy,
    onPress: () => {
      if (busy) return;
      if (onPress) {
        onPress();
        return;
      }
      void accountLogout.logout();
    },
  };

  return variant === 'ghost' ? (
    <TextButton {...logoutProps} />
  ) : (
    <SecondaryButton {...logoutProps} />
  );
}
