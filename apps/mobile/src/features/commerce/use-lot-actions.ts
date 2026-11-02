import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import type { PublicLot } from '@bidplace/contracts';

import { apiErrorMessage } from '../../lib/api-error-messages';
import { commerceKeys, invalidateWorkSurfaces } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { useInvisibleTurnstile } from '../auth/turnstile-widget';
import { attemptKey, attemptOutcome } from './bid-amount';

const REFRESH_LOT = new Set([
  'BID_TOO_LOW',
  'LISTING_NOT_OPEN',
  'LISTING_CHANGED',
]);

export type AttemptResult<T> =
  | { status: 'accepted'; value: T }
  | { status: 'busy' }
  | { status: 'failed' };

export function commerceActionError(
  error: unknown,
  fallback: string,
): string | null {
  if (!error) return null;
  if (
    error instanceof ApiClientError &&
    attemptOutcome(error.kind) === 'unknown'
  ) {
    return 'Ответ не получен. Повтор отправит тот же запрос.';
  }
  return apiErrorMessage(error) ?? fallback;
}

function useAttempt(
  action: 'bid' | 'purchase',
  publicId: string,
  listingId: string | null,
) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { getToken } = useInvisibleTurnstile(action);
  const key = useRef<string | null>(null);
  const body = useRef<string | null>(null);
  const gate = useRef(false);
  const viewerId = useRef<string | null>(null);
  const workId = useRef(publicId);
  const listing = useRef(listingId);
  viewerId.current = auth.user?.id ?? null;
  workId.current = publicId;
  if (listing.current !== listingId) {
    listing.current = listingId;
    key.current = null;
    body.current = null;
  }

  function remember(nextBody: string): string {
    const next = attemptKey({
      current: key.current,
      currentBody: body.current,
      body: nextBody,
    });
    key.current = next.key;
    body.current = next.body;
    return next.key;
  }

  function applyLot(
    lot: PublicLot,
    captured: { viewerId: string | null; publicId: string },
  ) {
    if (
      captured.viewerId !== viewerId.current ||
      captured.publicId !== workId.current
    ) {
      return;
    }
    queryClient.setQueryData(
      commerceKeys.lot(captured.publicId, captured.viewerId),
      lot,
    );
    void invalidateWorkSurfaces(queryClient, { publicId: captured.publicId });
    key.current = null;
    body.current = null;
  }

  function refreshOn(error: unknown) {
    if (
      !(error instanceof ApiClientError) ||
      error.code === null ||
      !REFRESH_LOT.has(error.code)
    ) {
      return;
    }
    void invalidateWorkSurfaces(queryClient, { publicId: workId.current });
  }

  return {
    api,
    getToken,
    gate,
    viewerId,
    workId,
    remember,
    applyLot,
    refreshOn,
    listingId,
  };
}

export function usePlaceBid(publicId: string, listingId: string | null) {
  const attempt = useAttempt('bid', publicId, listingId);
  const mutation = useMutation({
    mutationFn: async (amountMinor: number) => {
      const captured = {
        viewerId: attempt.viewerId.current,
        publicId: attempt.workId.current,
      };
      const token = await attempt.getToken();
      const result = await attempt.api.commerce.placeBid(listingId ?? '', {
        amountMinor,
        idempotencyKey: attempt.remember(String(amountMinor)),
        ...(token ? { turnstileToken: token } : {}),
      });
      return { lot: result.lot, captured };
    },
    onSuccess: (data) => attempt.applyLot(data.lot, data.captured),
    onError: (error) => attempt.refreshOn(error),
  });
  return {
    pending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    submit: (amountMinor: number): Promise<AttemptResult<null>> =>
      runAttempt(attempt.gate, Boolean(listingId), async () => {
        await mutation.mutateAsync(amountMinor);
        return null;
      }),
  };
}

export function usePurchase(publicId: string, listingId: string | null) {
  const attempt = useAttempt('purchase', publicId, listingId);
  const mutation = useMutation({
    mutationFn: async (comment: string) => {
      const captured = {
        viewerId: attempt.viewerId.current,
        publicId: attempt.workId.current,
      };
      const token = await attempt.getToken();
      const result = await attempt.api.commerce.purchase(listingId ?? '', {
        idempotencyKey: attempt.remember(comment),
        ...(comment ? { comment } : {}),
        ...(token ? { turnstileToken: token } : {}),
      });
      return { order: result.order, lot: result.lot, captured };
    },
    onSuccess: (data) => attempt.applyLot(data.lot, data.captured),
    onError: (error) => attempt.refreshOn(error),
  });
  return {
    pending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
    submit: (
      comment: string,
    ): Promise<AttemptResult<{ publicId: string; dealCode: string }>> =>
      runAttempt(attempt.gate, Boolean(listingId), async () => {
        const data = await mutation.mutateAsync(comment);
        return {
          publicId: data.order.publicId,
          dealCode: data.order.dealCode,
        };
      }),
  };
}

async function runAttempt<T>(
  gate: { current: boolean },
  ready: boolean,
  send: () => Promise<T>,
): Promise<AttemptResult<T>> {
  if (gate.current || !ready) return { status: 'busy' };
  gate.current = true;
  try {
    return { status: 'accepted', value: await send() };
  } catch {
    return { status: 'failed' };
  } finally {
    gate.current = false;
  }
}
