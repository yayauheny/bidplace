import type { QueryClient } from '@tanstack/react-query';

import { shouldClearSessionForError } from '../errors';
import { clearAuthenticatedSession } from './query-cache';

export function createUnauthorizedSessionRecovery(queryClient: QueryClient) {
  let recovery: Promise<void> | null = null;

  return (error: unknown): Promise<void> | null => {
    if (!shouldClearSessionForError(error)) {
      return null;
    }

    if (!recovery) {
      recovery = clearAuthenticatedSession(queryClient).finally(() => {
        recovery = null;
      });
    }

    return recovery;
  };
}
