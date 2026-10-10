import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';

import { logInfrastructureError } from '../../errors';
import { useAuth } from '../../providers/auth-provider';

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  );
}

export async function completeAccountLogout(input: {
  logout: () => Promise<void>;
  replaceHome: () => void;
  canLeave?: () => boolean;
}): Promise<void> {
  let aborted = false;
  try {
    await input.logout();
  } catch (error) {
    logInfrastructureError(error, 'account-logout');
    aborted = isAbortError(error);
  }
  if (aborted || (input.canLeave && !input.canLeave())) return;
  input.replaceHome();
}

export function useAccountLogout() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const logout = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const path = pathnameRef.current;
    try {
      await completeAccountLogout({
        logout: () => auth.logout(),
        replaceHome: () => {
          router.replace('/');
        },
        canLeave: () => mounted.current && pathnameRef.current === path,
      });
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [auth, router]);

  return { logout, busy };
}
