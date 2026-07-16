import { QueryClient, type QueryKey } from '@tanstack/react-query';

export const catalogueKeys = {
  all: ['catalogue'] as const,
  categories: ['catalogue', 'categories'] as const,
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

export async function invalidateAuthScopedQueries(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({
    predicate: (query) => isAuthScopedQueryKey(query.queryKey),
  });
}
