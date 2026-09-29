import { QueryClient, type QueryKey } from '@tanstack/react-query';

export const productKeys = {
  all: ['products'] as const,
};

export const categoryKeys = {
  all: ['categories'] as const,
};

export const authKeys = {
  session: ['user', 'me'] as const,
};

const authScopedRoots = new Set(['user', 'seller', 'admin']);

type AuthEpochState = {
  id: number;
  writesOpen: boolean;
};

const authEpochs = new WeakMap<QueryClient, AuthEpochState>();
const authEpochListeners = new WeakMap<QueryClient, Set<() => void>>();

function authEpochState(queryClient: QueryClient): AuthEpochState {
  return authEpochs.get(queryClient) ?? { id: 0, writesOpen: true };
}

function notifyAuthEpoch(queryClient: QueryClient) {
  authEpochListeners.get(queryClient)?.forEach((listener) => listener());
}

function beginSessionRetirement(queryClient: QueryClient): number {
  const next = authEpochState(queryClient).id + 1;
  authEpochs.set(queryClient, { id: next, writesOpen: false });
  notifyAuthEpoch(queryClient);
  return next;
}

function retirementStillOwns(queryClient: QueryClient, retirement: number): boolean {
  const state = authEpochState(queryClient);
  return state.id === retirement && !state.writesOpen;
}

function finishSessionRetirement(queryClient: QueryClient, retirement: number) {
  if (!retirementStillOwns(queryClient, retirement)) return;
  authEpochs.set(queryClient, { id: retirement + 1, writesOpen: true });
  notifyAuthEpoch(queryClient);
}

export function subscribeAuthEpoch(
  queryClient: QueryClient,
  listener: () => void,
): () => void {
  const listeners = authEpochListeners.get(queryClient) ?? new Set<() => void>();
  listeners.add(listener);
  authEpochListeners.set(queryClient, listeners);
  return () => {
    listeners.delete(listener);
  };
}

export function currentAuthEpoch(queryClient: QueryClient): number {
  return authEpochState(queryClient).id;
}

export function advanceAuthEpoch(queryClient: QueryClient): number {
  const next = currentAuthEpoch(queryClient) + 1;
  authEpochs.set(queryClient, { id: next, writesOpen: true });
  notifyAuthEpoch(queryClient);
  return next;
}

export function isAuthScopedQueryKey(queryKey: QueryKey): boolean {
  const [root] = queryKey;

  return typeof root === 'string' && authScopedRoots.has(root);
}

export async function clearAuthScopedDataExceptSession(
  queryClient: QueryClient,
  retirement?: number,
): Promise<void> {
  const predicate = (query: { queryKey: QueryKey }) =>
    isAuthScopedQueryKey(query.queryKey) &&
    !(query.queryKey[0] === 'user' && query.queryKey[1] === 'me');

  await queryClient.cancelQueries({ predicate });
  if (retirement !== undefined && !retirementStillOwns(queryClient, retirement)) return;
  queryClient.removeQueries({ predicate });
}

export function canWritePrivateCache(
  queryClient: QueryClient,
  epoch = currentAuthEpoch(queryClient),
): boolean {
  const state = authEpochState(queryClient);
  if (!state.writesOpen || epoch !== state.id) return false;
  const session = queryClient.getQueryState(authKeys.session);
  if (!session || session.data == null) return false;
  return true;
}

export async function clearAuthenticatedSession(
  queryClient: QueryClient,
): Promise<void> {
  const retirement = beginSessionRetirement(queryClient);
  await queryClient.cancelQueries({
    queryKey: authKeys.session,
    exact: true,
  });
  if (!retirementStillOwns(queryClient, retirement)) return;
  await clearAuthScopedDataExceptSession(queryClient, retirement);
  if (!retirementStillOwns(queryClient, retirement)) return;
  queryClient.setQueryData(authKeys.session, null);
  finishSessionRetirement(queryClient, retirement);
}

export async function replaceAuthenticatedSession(
  queryClient: QueryClient,
  user: unknown,
): Promise<void> {
  const retirement = beginSessionRetirement(queryClient);
  await queryClient.cancelQueries({
    queryKey: authKeys.session,
    exact: true,
  });
  if (!retirementStillOwns(queryClient, retirement)) return;
  await clearAuthScopedDataExceptSession(queryClient, retirement);
  if (!retirementStillOwns(queryClient, retirement)) return;
  queryClient.setQueryData(authKeys.session, user);
  finishSessionRetirement(queryClient, retirement);
}
