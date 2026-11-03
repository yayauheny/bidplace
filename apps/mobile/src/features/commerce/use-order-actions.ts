import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import type { FailOrderRequest, OrderDetail } from '@bidplace/contracts';

import {
  canWritePrivateCache,
  commerceKeys,
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
  const viewerId = useRef<string | null>(null);
  const orderId = useRef(publicId);
  const workId = useRef(workPublicId);
  const inflight = useRef<{
    viewerId: string | null;
    publicId: string;
    workPublicId: string;
  } | null>(null);
  viewerId.current = auth.user?.id ?? null;
  orderId.current = publicId;
  workId.current = workPublicId;
  const mutation = useMutation({
    mutationFn: async (input: TInput) => {
      const captured = {
        viewerId: viewerId.current,
        publicId: orderId.current,
        workPublicId: workId.current,
      };
      inflight.current = captured;
      const value = await run(input);
      return { value, captured };
    },
    onError: (error) => {
      const captured = inflight.current;
      if (!captured || !refreshOrderError(error)) return;
      if (!owns(captured, viewerId.current, orderId.current, workId.current)) return;
      if (!canWritePrivateCache(queryClient)) return;
      void queryClient.invalidateQueries({
        queryKey: commerceKeys.order(captured.publicId),
      });
      void queryClient.invalidateQueries({ queryKey: commerceKeys.attention() });
    },
    onSuccess: (data) => {
      if (!owns(data.captured, viewerId.current, orderId.current, workId.current)) return;
      if (!canWritePrivateCache(queryClient)) return;
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
        const data = await mutation.mutateAsync(input);
        const applied =
          owns(
            data.captured,
            viewerId.current,
            orderId.current,
            workId.current,
          ) && canWritePrivateCache(queryClient);
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
