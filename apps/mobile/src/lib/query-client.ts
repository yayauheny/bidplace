import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { logInfrastructureError } from '../errors';

export function createAppQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => logInfrastructureError(error, 'query'),
    }),
    mutationCache: new MutationCache({
      onError: (error) => logInfrastructureError(error, 'mutation'),
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
