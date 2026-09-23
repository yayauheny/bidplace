import { QueryClient, type QueryKey } from '@tanstack/react-query';

export const productKeys = {
  all: ['products'] as const,
  categories: ['products', 'categories'] as const,
};

export const authKeys = {
  session: ['user', 'me'] as const,
};

const authScopedRoots = new Set(['user', 'seller', 'admin']);

export function isAuthScopedQueryKey(queryKey: QueryKey): boolean {
  const [root] = queryKey;

  return typeof root === 'string' && authScopedRoots.has(root);
}

export async function clearAuthScopedQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.cancelQueries({
    predicate: (query) => isAuthScopedQueryKey(query.queryKey),
  });

  queryClient.removeQueries({
    predicate: (query) => isAuthScopedQueryKey(query.queryKey),
  });
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

export async function clearAuthenticatedSession(
  queryClient: QueryClient,
): Promise<void> {
  queryClient.setQueryData(authKeys.session, null);

  try {
    await clearAuthScopedQueries(queryClient);
  } finally {
    queryClient.setQueryData(authKeys.session, null);
  }
}
