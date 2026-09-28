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

export function canWritePrivateCache(queryClient: QueryClient): boolean {
  const session = queryClient.getQueryState(authKeys.session);
  if (!session) return true;
  return session.data != null;
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
}
