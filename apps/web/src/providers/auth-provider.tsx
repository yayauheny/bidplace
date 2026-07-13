'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useApiClient } from './api-provider';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@bidplace/contracts';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly ready: boolean;
  readonly login: (input: LoginRequest) => Promise<AuthResponse>;
  readonly register: (input: RegisterRequest) => Promise<AuthResponse>;
  readonly logout: () => Promise<void>;
  readonly refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildState(status: AuthStatus, user: User | null, accessToken: string | null) {
  return {
    status,
    user,
    accessToken,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    status: AuthStatus;
    user: User | null;
    accessToken: string | null;
  }>({
    status: 'loading',
    user: null,
    accessToken: null,
  });

  useEffect(() => {
    let active = true;

    api.auth
      .me()
      .then(({ user }) => {
        if (!active) {
          return;
        }

        setState(buildState('authenticated', user, null));
      })
      .catch(() => {
        if (active) {
          setState(buildState('anonymous', null, null));
        }
      });

    return () => {
      active = false;
    };
  }, [api]);

  const syncSession = useCallback(async (response: AuthResponse) => {
    setState(buildState('authenticated', response.user, null));
    await queryClient.invalidateQueries();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      user: state.user,
      accessToken: null,
      isAuthenticated: state.status === 'authenticated' && state.user !== null,
      isAdmin: state.user?.role === 'admin',
      ready: state.status !== 'loading',
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
        } catch {
          // Clearing local state is still correct if the server cookie is already gone.
        }

        queryClient.clear();
        setState(buildState('anonymous', null, null));
      },
      refreshSession: async () => {
        const response = await api.auth.me();
        setState(buildState('authenticated', response.user, null));
      },
    }),
    [api, queryClient, state.status, state.user, syncSession],
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
