import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import type { FailOrderRequest, OrderDetail } from '@bidplace/contracts';

import {
  canWritePrivateCache,
  commerceKeys,
  currentAuthEpoch,
  invalidateWorkSurfaces,
} from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import type { AttemptResult } from './use-lot-actions';

const REFRESH_ORDER = new Set([
  'ORDER_TRANSITION_NOT_ALLOWED',
  'LISTING_CHANGED',
  'NO_NEXT_BIDDER',
  'PRODUCT_IN_SALE',
  'conflict',
]);

export function useOrderCommands(publicId: string, workPublicId: string) {
  const api = useApiClient();
  const accept = useOrderWrite(publicId, workPublicId, () =>
    api.commerce.acceptOrder(publicId),
  );
  const decline = useOrderWrite(publicId, workPublicId, () =>
    api.commerce.declineOrder(publicId),
  );
  const complete = useOrderWrite(publicId, workPublicId, () =>
    api.commerce.completeOrder(publicId),
  );
  const fail = useOrderWrite(publicId, workPublicId, (input: FailOrderRequest) =>
    api.commerce.failOrder(publicId, input),
  );
  const note = useOrderWrite(publicId, workPublicId, (text: string) =>
    api.commerce.updateOrderNote(publicId, { note: text }),
  );
  const offerNext = useOrderWrite(publicId, workPublicId, () =>
    api.commerce.offerNextOrder(publicId),
  );
  const report = useOrderWrite(
    publicId,
    workPublicId,
    (input: { reason: 'NO_CONTACT' | 'TERMS_CHANGED' | 'NOT_AS_DESCRIBED' | 'NOT_HANDED_OVER' | 'FRAUD' | 'OTHER'; text?: string }) =>
      api.commerce.createOrderReport(publicId, input),
  );
  return { accept, decline, complete, fail, note, offerNext, report };
}

function useOrderWrite<TInput, TValue extends OrderDetail | { id: string }>(
  publicId: string,
  workPublicId: string,
  run: (input: TInput) => Promise<TValue>,
) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const gate = useRef(false);
  const mounted = useRef(true);
  const generation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const viewerId = useRef<string | null>(null);
  const orderId = useRef(publicId);
  const workId = useRef(workPublicId);
  const inflight = useRef<{
    viewerId: string | null;
    publicId: string;
    workPublicId: string;
    epoch: number;
    generation: number;
  } | null>(null);
  const nextViewer = auth.user?.id ?? null;
  if (viewerId.current !== nextViewer || orderId.current !== publicId || workId.current !== workPublicId) generation.current += 1;
  viewerId.current = nextViewer;
  orderId.current = publicId;
  workId.current = workPublicId;
  function owned(captured: NonNullable<typeof inflight.current>) {
    return mounted.current && captured.generation === generation.current &&
      owns(captured, viewerId.current, orderId.current, workId.current) &&
      canWritePrivateCache(queryClient, captured.epoch);
  }
  const mutation = useMutation({
    mutationFn: async ({ input, captured }: { input: TInput; captured: NonNullable<typeof inflight.current> }) => {
      inflight.current = captured;
      if (!owned(captured)) throw new Error('Order operation is no longer current');
      const value = await run(input);
      return { value, captured };
    },
    onError: (error) => {
      const captured = inflight.current;
      if (!captured || !refreshOrderError(error)) return;
      if (!owned(captured)) return;
      void queryClient.invalidateQueries({
        queryKey: commerceKeys.order(captured.publicId),
      });
      void queryClient.invalidateQueries({ queryKey: commerceKeys.attention() });
    },
    onSuccess: (data) => {
      if (!owned(data.captured)) return;
      if ('status' in data.value && 'publicId' in data.value) {
        queryClient.setQueryData(commerceKeys.order(data.value.publicId), data.value);
      }
      void queryClient.invalidateQueries({
        queryKey: commerceKeys.order(data.captured.publicId),
      });
      void queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
      void queryClient.invalidateQueries({ queryKey: commerceKeys.attention() });
      void invalidateWorkSurfaces(queryClient, {
        publicId: data.captured.workPublicId,
      });
    },
  });
  return {
    pending: mutation.isPending,
    error: mutation.error,
    submit: (input: TInput): Promise<AttemptResult<TValue | null>> =>
      send(gate, Boolean(publicId), async () => {
        const data = await mutation.mutateAsync({ input, captured: {
          epoch: currentAuthEpoch(queryClient),
          generation: generation.current,
          viewerId: viewerId.current,
          publicId: orderId.current,
          workPublicId: workId.current,
        } });
        const applied = owned(data.captured);
        return applied ? data.value : null;
      }),
  };
}

function refreshOrderError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    error.code !== null &&
    REFRESH_ORDER.has(error.code)
  );
}

function owns(
  captured: { viewerId: string | null; publicId: string; workPublicId: string },
  viewerId: string | null,
  publicId: string,
  workPublicId: string,
) {
  return (
    captured.viewerId !== null &&
    captured.viewerId === viewerId &&
    captured.publicId === publicId &&
    captured.workPublicId === workPublicId
  );
}

async function send<T>(
  gate: { current: boolean },
  ready: boolean,
  run: () => Promise<T>,
): Promise<AttemptResult<T>> {
  if (gate.current || !ready) return { status: 'busy' };
  gate.current = true;
  try {
    return { status: 'accepted', value: await run() };
  } catch {
    return { status: 'failed' };
  } finally {
    gate.current = false;
  }
}
