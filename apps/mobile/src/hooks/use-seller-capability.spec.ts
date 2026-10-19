/**
 * @vitest-environment jsdom
 *
 * Contract for useSellerCapability classification: a current error must
 * outrank a stale cached null so the dock/cabinet show an error instead of
 * "no profile", while a real not_found keeps reading as absence.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@bidplace/api-client';

import { flush } from '../testing/dom';
import { authKeys } from '../lib/query-cache';
import { sellerProfileQueryKey } from '../features/sellers/seller-profile-data';
import { useSellerCapability } from './use-seller-capability';

type SellerCapability = ReturnType<typeof useSellerCapability>;

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const harness = vi.hoisted(() => ({
  getMyProfile: vi.fn(),
}));

vi.mock('../providers/auth-provider', () => ({
  useAuth: () => ({ isAuthenticated: true, isAdmin: false }),
}));

vi.mock('../providers/api-provider', () => ({
  useApiClient: () => ({ sellers: { getMyProfile: harness.getMyProfile } }),
}));

function CapabilityProbe({
  onResult,
}: {
  onResult: (capability: SellerCapability) => void;
}) {
  onResult(useSellerCapability());
  return null;
}

function mount(onResult: (capability: SellerCapability) => void) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(authKeys.session, { id: 'user-a', slug: null });
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(CapabilityProbe, { onResult }),
      ),
    );
  });
  return { queryClient, unmount() {
    act(() => {
      root.unmount();
    });
    container.remove();
  } };
}

async function until(
  predicate: () => boolean,
  label: string,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (predicate()) return;
    await flush();
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const notFound = () =>
  new ApiClientError('missing', { kind: 'not_found', status: 404 });
const networkError = () =>
  new ApiClientError('network down', { kind: 'network', status: 0 });

beforeEach(() => {
  harness.getMyProfile.mockReset();
});

afterEach(() => {
  document.body.replaceChildren();
});

describe('useSellerCapability', () => {
  it('reads cached absence as absent without an error', async () => {
    harness.getMyProfile.mockRejectedValue(notFound());
    const seen: { current: SellerCapability | null } = { current: null };
    mount((value) => {
      seen.current = value;
    });

    await until(() => seen.current?.isAbsent === true, 'absent capability');
    expect(seen.current?.isError).toBe(false);
    expect(seen.current?.status).toBeNull();
  });

  it('lets a network error over the cached null surface as error, not absence', async () => {
    harness.getMyProfile.mockRejectedValue(notFound());
    const seen: { current: SellerCapability | null } = { current: null };
    const { queryClient } = mount((value) => {
      seen.current = value;
    });
    await until(() => seen.current?.isAbsent === true, 'absent capability');

    harness.getMyProfile.mockRejectedValue(networkError());
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: sellerProfileQueryKey,
      });
    });

    await until(() => seen.current?.isError === true, 'error capability');
    expect(seen.current?.isAbsent).toBe(false);
  });

  it('reads a 401 as error, never as absence', async () => {
    harness.getMyProfile.mockRejectedValue(
      new ApiClientError('unauthorized', {
        kind: 'unauthorized',
        status: 401,
      }),
    );
    const seen: { current: SellerCapability | null } = { current: null };
    mount((value) => {
      seen.current = value;
    });

    await until(() => seen.current?.isError === true, 'error capability');
    expect(seen.current?.isAbsent).toBe(false);
  });
});
