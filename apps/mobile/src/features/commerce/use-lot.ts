import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { PublicLot } from '@bidplace/contracts';

import { commerceKeys } from '../../lib/query-cache';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import {
  lotExtensionLabel,
  lotPollIntervalMs,
  syncedNowMs,
} from './lot-view';

export type LotRead = {
  status:
    | 'auth-loading'
    | 'loading'
    | 'error'
    | 'empty'
    | 'empty-stale'
    | 'ready'
    | 'stale';
  lot: PublicLot | null;
  extended: boolean;
  active: boolean;
  dataUpdatedAt: number;
  refetch: () => Promise<unknown>;
};

export function useLot(publicId: string): LotRead {
  const api = useApiClient();
  const auth = useAuth();
  const active = useLotActivity();
  const viewerId = auth.user?.id ?? null;
  const query = useQuery({
    queryKey: commerceKeys.lot(publicId, viewerId),
    enabled: auth.ready,
    queryFn: async ({ signal }) => {
      const lot = await api.commerce.getLot(publicId, { signal });
      if (signal.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }
      return lot;
    },
    retry: retryTransientPublicQuery,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (current) => {
      const data = current.state.data;
      return lotPollIntervalMs({
        active,
        lot: data,
        syncedNowMs:
          data && current.state.dataUpdatedAt
            ? syncedNowMs({
                serverNow: data.serverNow,
                dataUpdatedAt: current.state.dataUpdatedAt,
                deviceNow: Date.now(),
              })
            : null,
      });
    },
  });
  const wasActive = useRef(active);
  useEffect(() => {
    const becameActive = active && !wasActive.current;
    wasActive.current = active;
    if (!becameActive || !auth.ready || query.isFetching) return;
    void query.refetch();
  }, [active, auth.ready, query.isFetching, query.refetch]);

  const scopeKey = `${viewerId ?? ''}:${publicId}`;
  const seen = useRef<{ id: string; endsAt: string | null } | null>(null);
  const [extensionFor, setExtensionFor] = useState<string | null>(null);
  const [scope, setScope] = useState(scopeKey);
  if (scope !== scopeKey) {
    setScope(scopeKey);
    setExtensionFor(null);
    seen.current = null;
  }
  const lot = query.data ?? null;
  useEffect(() => {
    if (!lot) return;
    if (lotExtensionLabel(seen.current, lot)) setExtensionFor(lot.id);
    else if (seen.current && seen.current.id !== lot.id) setExtensionFor(null);
    seen.current = { id: lot.id, endsAt: lot.endsAt };
  }, [lot]);
  const extended = extensionFor !== null && extensionFor === lot?.id;

  const read = (
    status: LotRead['status'],
    value: PublicLot | null,
    dataUpdatedAt: number,
  ): LotRead => ({
    status,
    lot: value,
    extended: status === 'ready' || status === 'stale' ? extended : false,
    active,
    dataUpdatedAt,
    refetch: query.refetch,
  });

  if (!auth.ready) return read('auth-loading', null, 0);
  if (query.data === undefined && query.isPending) return read('loading', null, 0);
  if (query.data === undefined && query.isError) return read('error', null, 0);
  if (query.data == null) {
    return read(
      query.isError ? 'empty-stale' : 'empty',
      null,
      query.dataUpdatedAt,
    );
  }
  return read(query.isError ? 'stale' : 'ready', query.data, query.dataUpdatedAt);
}

function useLotActivity(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [visible, setVisible] = useState(
    () =>
      Platform.OS !== 'web' ||
      typeof document === 'undefined' ||
      document.visibilityState !== 'hidden',
  );
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const read = () => setVisible(document.visibilityState !== 'hidden');
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, []);
  return focused && visible;
}
