import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { logInfrastructureError } from '../../errors';
import { useAuth } from '../../providers/auth-provider';

export async function completeAccountLogout(input: {
  logout: () => Promise<void>;
  replaceHome: () => void;
}): Promise<void> {
  try {
    await input.logout();
  } catch (error) {
    logInfrastructureError(error, 'account-logout');
  }
  input.replaceHome();
}

export function useAccountLogout() {
  const auth = useAuth();
  const router = useRouter();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);

  const logout = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    await completeAccountLogout({
      logout: () => auth.logout(),
      replaceHome: () => {
        router.replace('/');
      },
    });
  }, [auth, router]);

  return { logout, busy };
}
