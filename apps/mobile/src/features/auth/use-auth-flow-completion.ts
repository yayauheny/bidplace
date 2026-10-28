import { useEffect, useState } from 'react';
import { useIsFocused, useRouter, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { currentAuthEpoch } from '../../lib/query-cache';
import { usePrivateCacheEpoch } from '../../lib/use-private-cache-epoch';
import { useAuth } from '../../providers/auth-provider';
import { useAuthSheetComplete } from './auth-sheet-context';
import type { SafeRedirect } from './auth-redirect';

// Protected routes must see the committed auth context before navigation.
export function useAuthFlowCompletion(busy: boolean) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const epoch = usePrivateCacheEpoch(queryClient);
  const focused = useIsFocused();
  const router = useRouter();
  const complete = useAuthSheetComplete();
  const [receipt, setReceipt] = useState<{
    userId: string;
    destination: SafeRedirect;
    epoch: number;
  } | null>(null);
  useEffect(() => {
    if (!receipt) return;
    if (!focused || epoch !== receipt.epoch) {
      setReceipt(null);
      return;
    }
    if (busy || !auth.ready || auth.user?.id !== receipt.userId) return;
    setReceipt(null);
    if (complete) complete(receipt.destination);
    else router.replace(receipt.destination as Href);
  }, [
    busy,
    auth.ready,
    auth.user?.id,
    complete,
    epoch,
    focused,
    receipt,
    router,
  ]);
  return (userId: string, destination: SafeRedirect) =>
    setReceipt({ userId, destination, epoch: currentAuthEpoch(queryClient) });
}
