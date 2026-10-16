import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@bidplace/contracts';
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { shouldClearSessionForError } from '../errors';
import { useApiClient } from './api-provider';
import {
  advanceAuthEpoch,
  authKeys,
  clearAuthenticatedSession,
  currentAuthEpoch,
  readAuthEpoch,
  replaceAuthenticatedSession,
  retireDraftWriteLease,
  subscribeAuthEpoch,
} from '../lib/query-cache';

type AuthCallOptions = { signal?: AbortSignal };

type AuthStatus = 'anonymous' | 'authenticated' | 'error';

type AuthContextValue = {
  readonly status: AuthStatus;
  readonly ready: boolean;
  readonly session: { user: User } | null;
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isAdmin: boolean;
  readonly canModerate: boolean;
  readonly login: (
    input: LoginRequest,
    options?: AuthCallOptions,
  ) => Promise<AuthResponse>;
  readonly register: (
    input: RegisterRequest,
    options?: AuthCallOptions,
  ) => Promise<AuthResponse>;
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
  if (epoch === retirement && state.id === retirement && !state.writesOpen)
    return true;
  if (epoch === finished && state.id === finished && state.writesOpen)
    return true;
  return epoch === retirement && state.id === finished && state.writesOpen;
}

type AuthWrite = {
  controller: AbortController;
  epoch: number;
  installing: boolean;
  settling: boolean;
  waits: boolean;
  ready: Promise<void>;
  installDone: Promise<void>;
  detach: () => void;
};

function abortError(): DOMException {
  return new DOMException('The operation was aborted', 'AbortError');
}

function beginAuthWrite(
  owner: { current: AuthWrite | null },
  queryClient: QueryClient,
  signal?: AbortSignal,
): AuthWrite {
  const previous = owner.current;
  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else if (signal) signal.addEventListener('abort', onParentAbort);
  const flight: AuthWrite = {
    controller,
    epoch: currentAuthEpoch(queryClient),
    installing: false,
    settling: false,
    waits: false,
    ready: Promise.resolve(),
    installDone: Promise.resolve(),
    detach: () => signal?.removeEventListener('abort', onParentAbort),
  };
  owner.current = flight;
  if (previous && previous !== flight) {
    previous.controller.abort();
    previous.detach();
  }
  if (previous?.installing) {
    if (!readAuthEpoch(queryClient).writesOpen) {
      flight.settling = true;
      advanceAuthEpoch(queryClient);
      flight.settling = false;
    }
    flight.epoch = currentAuthEpoch(queryClient);
    flight.waits = true;
    flight.ready = previous.installDone.then(() => {
      if (owner.current === flight && !flight.controller.signal.aborted) {
        flight.epoch = currentAuthEpoch(queryClient);
      }
    });
  }
  return flight;
}

function trackInstall(
  flight: AuthWrite,
  work: () => Promise<void>,
): Promise<void> {
  flight.installing = true;
  const run = work().finally(() => {
    flight.installing = false;
  });
  flight.installDone = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function ownEpochSettled(
  owner: { current: AuthWrite | null },
  flight: AuthWrite,
  queryClient: QueryClient,
): boolean {
  const state = readAuthEpoch(queryClient);
  return (
    owner.current === flight &&
    !flight.controller.signal.aborted &&
    state.id === flight.epoch + 2 &&
    state.writesOpen
  );
}

function releaseAuthWrite(
  owner: { current: AuthWrite | null },
  flight: AuthWrite,
) {
  flight.detach();
  if (owner.current === flight) owner.current = null;
}

function authWriteIsCurrent(
  owner: { current: AuthWrite | null },
  flight: AuthWrite,
  queryClient: QueryClient,
): boolean {
  return (
    owner.current === flight &&
    !flight.controller.signal.aborted &&
    currentAuthEpoch(queryClient) === flight.epoch
  );
}

function assertAuthWriteCurrent(
  owner: { current: AuthWrite | null },
  flight: AuthWrite,
  queryClient: QueryClient,
): void {
  if (!authWriteIsCurrent(owner, flight, queryClient)) throw abortError();
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
  const authWrite = useRef<AuthWrite | null>(null);

  useEffect(() => {
    return subscribeAuthEpoch(queryClient, () => {
      const flight = authWrite.current;
      if (!flight || flight.settling) return;
      const state = readAuthEpoch(queryClient);
      if (flight.installing) {
        if (state.id === flight.epoch + 1 && !state.writesOpen) return;
        if (state.id === flight.epoch + 2 && state.writesOpen) return;
        flight.controller.abort();
        return;
      }
      if (state.id !== flight.epoch) flight.controller.abort();
    });
  }, [queryClient]);

  useEffect(() => {
    const owner = authWrite;
    return () => {
      owner.current?.controller.abort();
    };
  }, []);

  const clearSession = useCallback(async () => {
    const flight = beginAuthWrite(authWrite, queryClient);
    try {
      if (flight.waits) await flight.ready;
      if (authWrite.current !== flight || flight.controller.signal.aborted)
        return;
      await trackInstall(flight, () => clearAuthenticatedSession(queryClient));
    } finally {
      releaseAuthWrite(authWrite, flight);
    }
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
      login: async (input: LoginRequest, options?: AuthCallOptions) => {
        const flight = beginAuthWrite(authWrite, queryClient, options?.signal);
        try {
          if (flight.waits) {
            await flight.ready;
            if (
              authWrite.current !== flight ||
              flight.controller.signal.aborted
            )
              throw abortError();
          }
          const response = await api.auth.login(input, {
            signal: flight.controller.signal,
          });
          assertAuthWriteCurrent(authWrite, flight, queryClient);
          await trackInstall(flight, () =>
            setAuthenticatedSession(response.user),
          );
          const installed =
            queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          if (
            !ownEpochSettled(authWrite, flight, queryClient) ||
            installed?.id !== response.user.id
          ) {
            throw abortError();
          }
          return response;
        } finally {
          releaseAuthWrite(authWrite, flight);
        }
      },
      register: async (input: RegisterRequest, options?: AuthCallOptions) => {
        const flight = beginAuthWrite(authWrite, queryClient, options?.signal);
        try {
          if (flight.waits) {
            await flight.ready;
            if (
              authWrite.current !== flight ||
              flight.controller.signal.aborted
            )
              throw abortError();
          }
          const response = await api.auth.register(input, {
            signal: flight.controller.signal,
          });
          assertAuthWriteCurrent(authWrite, flight, queryClient);
          const startEpoch = flight.epoch;
          activeRegisterInstall.set(queryClient, { startEpoch });
          try {
            await trackInstall(flight, () =>
              setAuthenticatedSession(response.user),
            );
            const installed =
              queryClient.getQueryData<User | null>(authKeys.session) ?? null;
            const done = currentAuthEpoch(queryClient);
            if (
              ownEpochSettled(authWrite, flight, queryClient) &&
              installed?.id === response.user.id &&
              done === startEpoch + 2
            ) {
              const epochs =
                registerInstalledEpochs.get(queryClient) ?? new Set<number>();
              epochs.add(startEpoch + 1);
              epochs.add(done);
              registerInstalledEpochs.set(queryClient, epochs);
            }
          } finally {
            activeRegisterInstall.delete(queryClient);
          }
          const installed =
            queryClient.getQueryData<User | null>(authKeys.session) ?? null;
          if (
            !ownEpochSettled(authWrite, flight, queryClient) ||
            installed?.id !== response.user.id
          ) {
            throw abortError();
          }
          return response;
        } finally {
          releaseAuthWrite(authWrite, flight);
        }
      },
      logout: async () => {
        // Local draft writes belong to the session being left: retire their
        // lease before any network work so a write scheduled or executed
        // during the logout cannot land in storage. The next session issues
        // a fresh lease when it installs (replaceAuthenticatedSession).
        retireDraftWriteLease(queryClient);
        const flight = beginAuthWrite(authWrite, queryClient);
        try {
          if (flight.waits) {
            await flight.ready;
            if (
              authWrite.current !== flight ||
              flight.controller.signal.aborted
            )
              throw abortError();
          }
          let failure: unknown;
          try {
            await api.auth.logout({ signal: flight.controller.signal });
          } catch (error) {
            failure = error;
          }
          if (!authWriteIsCurrent(authWrite, flight, queryClient)) {
            if (failure instanceof Error && failure.name === 'AbortError')
              throw failure;
            throw abortError();
          }
          await trackInstall(flight, () =>
            clearAuthenticatedSession(queryClient),
          );
          const cleared =
            ownEpochSettled(authWrite, flight, queryClient) &&
            queryClient.getQueryData(authKeys.session) == null;
          if (!cleared) throw abortError();
          if (failure !== undefined) throw failure;
        } finally {
          releaseAuthWrite(authWrite, flight);
        }
      },
      refreshSession: async () => {
        const epoch = currentAuthEpoch(queryClient);
        try {
          const next = (await api.auth.me()).user;
          if (currentAuthEpoch(queryClient) !== epoch) {
            return (
              queryClient.getQueryData<User | null>(authKeys.session) ?? null
            );
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
            return (
              queryClient.getQueryData<User | null>(authKeys.session) ?? null
            );
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
