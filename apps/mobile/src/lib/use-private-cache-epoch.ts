import { useSyncExternalStore } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import { currentAuthEpoch, subscribeAuthEpoch } from './query-cache';

export function usePrivateCacheEpoch(queryClient: QueryClient): number {
  return useSyncExternalStore(
    (onStoreChange) => subscribeAuthEpoch(queryClient, onStoreChange),
    () => currentAuthEpoch(queryClient),
    () => currentAuthEpoch(queryClient),
  );
}
