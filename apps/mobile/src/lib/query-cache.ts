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
const authEpochs = new WeakMap<QueryClient, number>();
const authEpochListeners = new WeakMap<QueryClient, Set<() => void>>();

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
  return authEpochs.get(queryClient) ?? 0;
}

export function advanceAuthEpoch(queryClient: QueryClient): number {
  const next = currentAuthEpoch(queryClient) + 1;
  authEpochs.set(queryClient, next);
  authEpochListeners.get(queryClient)?.forEach((listener) => listener());
  return next;
}

export function isAuthScopedQueryKey(queryKey: QueryKey): boolean {
  const [root] = queryKey;

  return typeof root === 'string' && authScopedRoots.has(root);
}

export async function clearAuthScopedDataExceptSession(
  queryClient: QueryClient,
): Promise<void> {
  const predicate = (query: { queryKey: QueryKey }) =>
    isAuthScopedQueryKey(query.queryKey) &&
    !(query.queryKey[0] === 'user' && query.queryKey[1] === 'me');

  await queryClient.cancelQueries({ predicate });
  queryClient.removeQueries({ predicate });
}

export function canWritePrivateCache(
  queryClient: QueryClient,
  epoch = currentAuthEpoch(queryClient),
): boolean {
  if (epoch !== currentAuthEpoch(queryClient)) return false;
  const session = queryClient.getQueryState(authKeys.session);
  if (!session || session.data == null) return false;
  return true;
}

export async function clearAuthenticatedSession(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    queryKey: authKeys.session,
    exact: true,
  });
  await clearAuthScopedDataExceptSession(queryClient);
  queryClient.setQueryData(authKeys.session, null);
  advanceAuthEpoch(queryClient);
}
