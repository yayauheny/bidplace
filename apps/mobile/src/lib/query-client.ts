import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { logInfrastructureError, shouldClearSessionForError } from '../errors';
import { createUnauthorizedSessionRecovery } from './unauthorized-session-recovery';

export function createAppQueryClient() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        logInfrastructureError(error, 'query');
        recoverUnauthorizedSession(error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        logInfrastructureError(error, 'mutation');
        recoverUnauthorizedSession(error);
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !shouldClearSessionForError(error) && failureCount < 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });

  const recoverUnauthorizedSession = createUnauthorizedSessionRecovery(queryClient);

  return queryClient;
}
