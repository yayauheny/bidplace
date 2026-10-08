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
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { shouldClearSessionForError } from '../errors';
import { useApiClient } from './api-provider';
import {
  authKeys,
  clearAuthenticatedSession,
  currentAuthEpoch,
  readAuthEpoch,
  replaceAuthenticatedSession,
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

type RegisterInstall = { startEpoch: number };

const activeRegisterInstall = new WeakMap<QueryClient, RegisterInstall>();
const registerInstalledEpochs = new WeakMap<QueryClient, Set<number>>();

export function registerSessionChangeIsOwn(
  queryClient: QueryClient,
  epoch: number,
): boolean {
  if (registerInstalledEpochs.get(queryClient)?.has(epoch)) return true;
  const active = activeRegisterInstall.get(queryClient);
  if (!active) return false;
  const state = readAuthEpoch(queryClient);
  const retirement = active.startEpoch + 1;
  const finished = active.startEpoch + 2;
  if (epoch === retirement && state.id === retirement && !state.writesOpen) return true;
  if (epoch === finished && state.id === finished && state.writesOpen) return true;
  return epoch === retirement && state.id === finished && state.writesOpen;
}

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
      await replaceAuthenticatedSession(queryClient, nextUser);
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
        const startEpoch = currentAuthEpoch(queryClient);
        const response = await api.auth.register(input);
        if (currentAuthEpoch(queryClient) !== startEpoch) return response;
        activeRegisterInstall.set(queryClient, { startEpoch });
        try {
          await setAuthenticatedSession(response.user);
          const installed =
            queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          const done = currentAuthEpoch(queryClient);
          if (installed?.id === response.user.id && done === startEpoch + 2) {
            const epochs = registerInstalledEpochs.get(queryClient) ?? new Set<number>();
            epochs.add(startEpoch + 1);
            epochs.add(done);
            registerInstalledEpochs.set(queryClient, epochs);
          }
        } finally {
          activeRegisterInstall.delete(queryClient);
        }
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
        const epoch = currentAuthEpoch(queryClient);
        try {
          const next = (await api.auth.me()).user;
          if (currentAuthEpoch(queryClient) !== epoch) {
            return queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          }
          const current =
            queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          if (current?.id === next.id) {
            queryClient.setQueryData(authKeys.session, next);
            return next;
          }
          await replaceAuthenticatedSession(queryClient, next);
          return next;
        } catch (error) {
          if (currentAuthEpoch(queryClient) !== epoch) {
            return queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          }
          if (shouldClearSessionForError(error)) {
            await clearAuthenticatedSession(queryClient);
            return null;
          }
          throw error;
        }
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
