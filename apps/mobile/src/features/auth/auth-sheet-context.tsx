import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from 'react';

import type { SafeRedirect } from './auth-redirect';

export type AuthSheetGuard = { dirty: boolean; busy: boolean };

type AuthSheetContextValue = {
  onGuard: (guard: AuthSheetGuard) => void;
  complete: (destination: SafeRedirect) => void;
};

const AuthSheetGuardContext = createContext<AuthSheetContextValue | null>(null);

export function AuthSheetGuardProvider({
  children,
  onGuard,
  complete,
}: {
  children: ReactNode;
  onGuard: (guard: AuthSheetGuard) => void;
  complete: (destination: SafeRedirect) => void;
}) {
  const value = useMemo(() => ({ onGuard, complete }), [complete, onGuard]);
  return (
    <AuthSheetGuardContext.Provider value={value}>
      {children}
    </AuthSheetGuardContext.Provider>
  );
}

export function useAuthSheetGuard(guard: AuthSheetGuard) {
  const sheet = useContext(AuthSheetGuardContext);
  useLayoutEffect(() => {
    sheet?.onGuard(guard);
  }, [guard.busy, guard.dirty, sheet]);
  useLayoutEffect(() => {
    return () => sheet?.onGuard({ dirty: false, busy: false });
  }, [sheet]);
}

export function useAuthSheetComplete() {
  return useContext(AuthSheetGuardContext)?.complete ?? null;
}
