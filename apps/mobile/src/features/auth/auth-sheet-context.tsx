import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type AuthSheetGuard = { dirty: boolean; busy: boolean };

const AuthSheetGuardContext = createContext<((guard: AuthSheetGuard) => void) | null>(null);

export function AuthSheetGuardProvider({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange: (guard: AuthSheetGuard) => void;
}) {
  return (
    <AuthSheetGuardContext.Provider value={onChange}>{children}</AuthSheetGuardContext.Provider>
  );
}

export function useAuthSheetGuard(guard: AuthSheetGuard) {
  const onChange = useContext(AuthSheetGuardContext);
  useEffect(() => {
    onChange?.(guard);
    return () => onChange?.({ dirty: false, busy: false });
  }, [guard.busy, guard.dirty, onChange]);
}
