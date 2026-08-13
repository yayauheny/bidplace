import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@bidplace/contracts';
import { useQueryClient } from '@tanstack/react-query';

import { useApiClient } from './api-provider';
import {
  clearAuthScopedQueries,
  invalidateAuthScopedQueries,
} from '../lib/query-cache';
import {
  getUserFacingErrorMessage,
  shouldClearSessionForError,
} from '../lib/errors';

type AuthStatus = 'anonymous' | 'authenticated' | 'error';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly ready: boolean;
  readonly session: { user: User } | null;
  readonly user: User | null;
  readonly sessionError: string | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly canModerate: boolean;
  readonly login: (input: LoginRequest) => Promise<AuthResponse>;
  readonly register: (input: RegisterRequest) => Promise<AuthResponse>;
  readonly logout: () => Promise<void>;
  readonly refreshSession: () => Promise<void>;
  readonly clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('anonymous');
  const [user, setUser] = useState<User | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    api.auth
      .me()
      .then(({ user: nextUser }) => {
        if (!active) {
          return;
        }

        setUser(nextUser);
        setStatus('authenticated');
        setSessionError(null);
      })
      .catch((error) => {
        if (!active) return;
        setUser(null);
        if (shouldClearSessionForError(error)) {
          setStatus('anonymous');
          setSessionError(null);
          return;
        }
        setStatus('error');
        setSessionError(
          getUserFacingErrorMessage(
            error,
            'Не удалось проверить текущую сессию.',
          ),
        );
      })
      .finally(() => {
        if (active) {
          setReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [api]);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
    setSessionError(null);
  }, []);

  const syncSession = useCallback(
    async () => {
      try {
        const { user: verifiedUser } = await api.auth.me();
        await clearAuthScopedQueries(queryClient);
        setUser(verifiedUser);
        setStatus('authenticated');
        setSessionError(null);
        await invalidateAuthScopedQueries(queryClient);
      } catch (error) {
        await clearAuthScopedQueries(queryClient);
        clearSession();
        throw error;
      }
    },
    [api, clearSession, queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready,
      session: user ? { user } : null,
      user,
      sessionError,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      canModerate: user?.role === 'admin',
      login: async (input: LoginRequest) => {
        const response = await api.auth.login(input);
        await syncSession();
        return response;
      },
      register: async (input: RegisterRequest) => {
        const response = await api.auth.register(input);
        await syncSession();
        return response;
      },
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          await clearAuthScopedQueries(queryClient);
          clearSession();
        }
      },
      refreshSession: async () => {
        try {
          const response = await api.auth.me();
          setUser(response.user);
          setStatus('authenticated');
          setSessionError(null);
        } catch (error) {
          if (shouldClearSessionForError(error)) {
            await clearAuthScopedQueries(queryClient);
            clearSession();
            return;
          }
          setUser(null);
          setStatus('error');
          setSessionError(
            getUserFacingErrorMessage(
              error,
              'Не удалось проверить текущую сессию.',
            ),
          );
        }
      },
      clearSession,
    }),
    [
      api,
      clearSession,
      queryClient,
      ready,
      sessionError,
      status,
      syncSession,
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
