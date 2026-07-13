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

import { useApiClient } from './api-provider';
import { useQueryClient } from '@tanstack/react-query';

type AuthStatus = 'anonymous' | 'authenticated';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly ready: boolean;
  readonly session: { user: User } | null;
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly canCreateAuction: boolean;
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
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setStatus('anonymous');
        }
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

  const syncSession = useCallback(
    async (response: AuthResponse) => {
      setUser(response.user);
      setStatus('authenticated');
      await queryClient.invalidateQueries();
    },
    [queryClient],
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      ready,
      session: user ? { user } : null,
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      canCreateAuction: user !== null,
      canModerate: user?.role === 'admin',
      login: async (input: LoginRequest) => {
        const response = await api.auth.login(input);
        await syncSession(response);
        return response;
      },
      register: async (input: RegisterRequest) => {
        const response = await api.auth.register(input);
        await syncSession(response);
        return response;
      },
      logout: async () => {
        try {
          await api.auth.logout();
        } finally {
          queryClient.clear();
          clearSession();
        }
      },
      refreshSession: async () => {
        try {
          const response = await api.auth.me();
          setUser(response.user);
          setStatus('authenticated');
        } catch {
          queryClient.clear();
          clearSession();
        }
      },
      clearSession,
    }),
    [api, clearSession, queryClient, ready, status, syncSession, user],
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
