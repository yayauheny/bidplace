import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@bidplace/contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from './api-provider';
import {
  advanceAuthEpoch,
  authKeys,
  clearAuthenticatedSession,
  clearAuthScopedDataExceptSession,
} from '../lib/query-cache';

type AuthStatus = 'anonymous' | 'authenticated' | 'error';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly ready: boolean;
  readonly session: { user: User } | null;
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly canModerate: boolean;
  readonly login: (input: LoginRequest) => Promise<AuthResponse>;
  readonly register: (input: RegisterRequest) => Promise<AuthResponse>;
  readonly logout: () => Promise<void>;
  readonly refreshSession: () => Promise<User | null>;
  readonly clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: authKeys.session,
    queryFn: async () => (await api.auth.me()).user,
    retry: false,
    staleTime: Infinity,
  });
  const user = sessionQuery.data ?? null;
  const status: AuthStatus = sessionQuery.isError
    ? 'error'
    : user
      ? 'authenticated'
      : 'anonymous';
  const ready = sessionQuery.isSuccess || sessionQuery.isError;

  const clearSession = useCallback(async () => {
    await clearAuthenticatedSession(queryClient);
  }, [queryClient]);

  const setAuthenticatedSession = useCallback(
    async (nextUser: User) => {
      await clearAuthScopedDataExceptSession(queryClient);
      queryClient.setQueryData(authKeys.session, nextUser);
      advanceAuthEpoch(queryClient);
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready,
      session: user ? { user } : null,
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      canModerate: user?.role === 'admin',
      login: async (input: LoginRequest) => {
        const response = await api.auth.login(input);
        await setAuthenticatedSession(response.user);
        return response;
      },
      register: async (input: RegisterRequest) => {
        const response = await api.auth.register(input);
        await setAuthenticatedSession(response.user);
        return response;
      },
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          await clearSession();
        }
      },
      refreshSession: async () => {
        const result = await sessionQuery.refetch();
        return result.data ?? null;
      },
      clearSession,
    }),
    [
      api,
      clearSession,
      queryClient,
      ready,
      sessionQuery,
      setAuthenticatedSession,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
