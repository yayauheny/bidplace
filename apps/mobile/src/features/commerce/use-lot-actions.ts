import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@bidplace/api-client';
import {
  ApiErrorCode,
  type CreateListingRequest,
  type PublicLot,
} from '@bidplace/contracts';

import { apiErrorMessage } from '../../lib/api-error-messages';
import {
  canWritePrivateCache,
  commerceKeys,
  currentAuthEpoch,
  invalidateWorkSurfaces,
} from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';
import { useInvisibleTurnstile } from '../auth/turnstile-widget';
import { attemptKey, attemptOutcome } from './bid-amount';
import { openSaleNotice } from './create-lot-form';

const REFRESH_LOT = new Set([
  'BID_TOO_LOW',
  'LISTING_NOT_OPEN',
  'LISTING_CHANGED',
  'PRODUCT_ALREADY_SOLD',
  'conflict',
  'BUYER_CONTACTS_REQUIRED',
]);

const REFRESH_LISTING = new Set<string>([
  ApiErrorCode.PRODUCT_IN_SALE,
  ApiErrorCode.PRODUCT_ALREADY_SOLD,
  ApiErrorCode.PRODUCT_STATE_CONFLICT,
  ApiErrorCode.LISTING_CHANGED,
  ApiErrorCode.CONFLICT,
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
  const mounted = useRef(true);
  const generation = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const nextViewer = auth.user?.id ?? null;
  if (viewerId.current !== nextViewer || workId.current !== publicId || listing.current !== listingId) generation.current += 1;
  viewerId.current = nextViewer;
  workId.current = publicId;
  if (listing.current !== listingId) {
    listing.current = listingId;
    key.current = null;
    body.current = null;
  }

  const inflight = useRef<{ viewerId: string | null; publicId: string; epoch: number; generation: number } | null>(null);
  function snapshot() {
    const captured = { viewerId: viewerId.current, publicId: workId.current, epoch: currentAuthEpoch(queryClient), generation: generation.current };
    inflight.current = captured;
    return captured;
  }
  function owned(captured: NonNullable<typeof inflight.current>) {
    return mounted.current && captured.generation === generation.current &&
      captured.viewerId !== null && captured.viewerId === viewerId.current &&
      captured.publicId === workId.current && canWritePrivateCache(queryClient, captured.epoch);
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
    captured: NonNullable<typeof inflight.current>,
  ) {
    if (!owned(captured)) return;
    queryClient.setQueryData(
      commerceKeys.lot(captured.publicId, captured.viewerId),
      lot,
    );
    void invalidateWorkSurfaces(queryClient, { publicId: captured.publicId });
    key.current = null;
    body.current = null;
  }

  function refreshOn(error: unknown) {
    if (!inflight.current || !owned(inflight.current)) return;
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
    snapshot,
    owned,
  };
}

export function usePlaceBid(publicId: string, listingId: string | null) {
  const attempt = useAttempt('bid', publicId, listingId);
  const mutation = useMutation({
    mutationFn: async ({ amountMinor, captured }: { amountMinor: number; captured: ReturnType<typeof attempt.snapshot> }) => {
      if (!attempt.owned(captured)) throw new Error('Commerce operation is no longer current');
      const token = await attempt.getToken();
      if (!attempt.owned(captured)) throw new Error('Commerce operation is no longer current');
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
        await mutation.mutateAsync({ amountMinor, captured: attempt.snapshot() });
        return null;
      }),
  };
}

export function usePurchase(publicId: string, listingId: string | null) {
  const attempt = useAttempt('purchase', publicId, listingId);
  const mutation = useMutation({
    mutationFn: async ({ comment, captured }: { comment: string; captured: ReturnType<typeof attempt.snapshot> }) => {
      if (!attempt.owned(captured)) throw new Error('Commerce operation is no longer current');
      const token = await attempt.getToken();
      if (!attempt.owned(captured)) throw new Error('Commerce operation is no longer current');
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
    ): Promise<
      AttemptResult<{ publicId: string; dealCode: string; applied: boolean }>
    > =>
      runAttempt(attempt.gate, Boolean(listingId), async () => {
        const data = await mutation.mutateAsync({ comment, captured: attempt.snapshot() });
        const applied = attempt.owned(data.captured);
        return {
          publicId: data.order.publicId,
          dealCode: data.order.dealCode,
          applied,
        };
      }),
  };
}

type ListingSnapshot = {
  generation: number;
  viewerId: string | null;
  publicId: string;
  productId: string;
};

function useListingCommand(publicId: string, productId: string) {
  const api = useApiClient();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const gate = useRef(false);
  const viewerId = useRef<string | null>(null);
  const workId = useRef(publicId);
  const product = useRef(productId);
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const nextViewer = auth.user?.id ?? null;
  if (viewerId.current !== nextViewer || workId.current !== publicId || product.current !== productId) generation.current += 1;
  viewerId.current = nextViewer;
  workId.current = publicId;
  product.current = productId;

  function snapshot(): ListingSnapshot {
    return {
      generation: generation.current,
      viewerId: viewerId.current,
      publicId: workId.current,
      productId: product.current,
    };
  }

  function owned(captured: ListingSnapshot) {
    return (
      mounted.current &&
      captured.generation === generation.current &&
      captured.viewerId !== null &&
      captured.viewerId === viewerId.current &&
      captured.publicId === workId.current &&
      captured.productId === product.current &&
      canWritePrivateCache(queryClient)
    );
  }

  function refresh(captured: ListingSnapshot) {
    if (!owned(captured)) return;
    void invalidateWorkSurfaces(queryClient, { publicId: captured.publicId });
  }

  return { api, gate, snapshot, owned, refresh, productId };
}

export type CreateListingResult = {
  applied: boolean;
  outcome: 'created' | 'open' | 'unknown';
  notice: string | null;
};

const UNKNOWN_CREATE_NOTICE = 'Результат создания пока неизвестен. Проверьте снова; повторная отправка отключена.';

export function useCreateListing(publicId: string, productId: string) {
  const command = useListingCommand(publicId, productId);
  const uncertain = useRef<ListingSnapshot | null>(null);
  const [recovery, setRecovery] = useState<{ captured: ListingSnapshot; result: CreateListingResult } | null>(null);
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ input, captured }: { input: CreateListingRequest | null; captured: ListingSnapshot }) => {
      if (!command.owned(captured)) return { captured, outcome: 'unknown' as const, notice: null };
      const checking = uncertain.current !== null && command.owned(uncertain.current);
      if (!input && !checking) return { captured, outcome: 'unknown' as const, notice: UNKNOWN_CREATE_NOTICE };
      if (input && !checking) {
        try {
          await command.api.commerce.createListing(captured.productId, input);
          return { captured, outcome: 'created' as const, notice: null };
        } catch (error) {
          if (!command.owned(captured)) return { captured, outcome: 'unknown' as const, notice: null };
          if (!recoverableCreate(error)) {
            refreshListingError(command.refresh, captured, error);
            throw error;
          }
          uncertain.current = captured;
        }
      }
      if (!command.owned(captured)) return { captured, outcome: 'unknown' as const, notice: null };
      const lot = await readCreateState(command.api, captured.publicId);
      if (!command.owned(captured)) return { captured, outcome: 'unknown' as const, notice: null };
      if (lot && lot.viewer?.role === 'seller' && (lot.effectiveStatus === 'LIVE' || lot.effectiveStatus === 'SCHEDULED')) {
        return { captured, outcome: 'open' as const, notice: openSaleNotice(lot) };
      }
      return { captured, outcome: 'unknown' as const, notice: UNKNOWN_CREATE_NOTICE };
    },
    onSuccess: (data) => {
      if (!command.owned(data.captured)) return;
      command.refresh(data.captured);
      if (data.outcome !== 'created') setRecovery({ captured: data.captured, result: { applied: true, outcome: data.outcome, notice: data.notice } });
    },
  });
  function run(input: CreateListingRequest | null): Promise<AttemptResult<CreateListingResult>> {
    const captured = command.snapshot();
    const canCheck = uncertain.current !== null && command.owned(uncertain.current);
    return runAttempt(command.gate, Boolean(command.productId) && (input !== null || canCheck), async () => {
      const data = await mutation.mutateAsync({ input, captured });
      const applied = command.owned(data.captured);
      return { applied, outcome: data.outcome, notice: applied ? data.notice : null };
    });
  }
  return {
    pending: mutation.isPending,
    error: mutation.error,
    recovery: recovery && command.owned(recovery.captured) ? recovery.result : null,
    submit: (input: CreateListingRequest) => run(input),
    checkAgain: () => run(null),
  };
}

export function useCancelListing(publicId: string, listingId: string | null) {
  const command = useListingCommand(publicId, listingId ?? '');
  const mutation = useMutation({
    mutationFn: async () => {
      const captured = command.snapshot();
      try {
        const cancelled = await command.api.commerce.cancelListing(
          captured.productId,
        );
        return { cancelled, captured };
      } catch (error) {
        refreshListingError(command.refresh, captured, error);
        throw error;
      }
    },
    onSuccess: (data) => command.refresh(data.captured),
  });
  return {
    pending: mutation.isPending,
    error: mutation.error,
    submit: (): Promise<AttemptResult<boolean>> =>
      runAttempt(command.gate, Boolean(listingId), async () => {
        const data = await mutation.mutateAsync();
        return command.owned(data.captured);
      }),
  };
}

async function readCreateState(
  api: ReturnType<typeof useApiClient>,
  publicId: string,
): Promise<PublicLot | null> {
  try {
    return await api.commerce.getLot(publicId);
  } catch {
    // A failed read cannot resolve an uncertain write; keep creation blocked.
    return null;
  }
}

function recoverableCreate(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.code === ApiErrorCode.PRODUCT_IN_SALE ||
      attemptOutcome(error.kind) === 'unknown')
  );
}

function refreshListingError(
  refresh: (captured: ListingSnapshot) => void,
  captured: ListingSnapshot,
  error: unknown,
) {
  if (
    error instanceof ApiClientError &&
    error.code !== null &&
    REFRESH_LISTING.has(error.code)
  ) {
    refresh(captured);
  }
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
