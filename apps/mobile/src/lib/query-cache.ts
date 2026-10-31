import { QueryClient, type QueryKey } from '@tanstack/react-query';

export const categoryKeys = {
  all: ['categories'] as const,
};

export const authKeys = {
  session: ['user', 'me'] as const,
  options: ['auth', 'options'] as const,
  onboarding: ['user', 'auth', 'onboarding'] as const,
  onboardingEmail: ['user', 'auth', 'onboarding', 'email'] as const,
  emailLoginState: ['user', 'auth', 'email-login', 'state'] as const,
  connections: (userId: string | undefined) =>
    ['user', userId, 'auth', 'connections'] as const,
};

export const portfolioKeys = {
  home: ['portfolio-home'] as const,
  facets: ['portfolio-facets'] as const,
  workRoot: ['portfolio-work'] as const,
  work: (publicId: string) => ['portfolio-work', publicId] as const,
  works: (query?: unknown) =>
    query === undefined
      ? (['portfolio-works'] as const)
      : (['portfolio-works', query] as const),
  authors: (query?: unknown) =>
    query === undefined
      ? (['portfolio-authors'] as const)
      : (['portfolio-authors', query] as const),
  authorRoot: ['public-author'] as const,
  author: (slug: string) => ['public-author', slug] as const,
};

export const ownerWorkKeys = {
  cabinet: ['seller', 'cabinet', 'works'] as const,
  detailRoot: ['seller', 'product'] as const,
  detail: (productId: string) => ['seller', 'product', productId] as const,
};

export const sellerKeys = {
  profile: ['seller', 'profile'] as const,
  application: ['seller', 'application'] as const,
  applicationPhotoRoot: ['seller', 'application-photo'] as const,
  applicationPhoto: (profileId: string | undefined, token: unknown) =>
    ['seller', 'application-photo', profileId, token] as const,
};

export const catalogKeys = {
  termsRoot: ['catalog', 'terms'] as const,
  terms: (role: string | null) => ['catalog', 'terms', role] as const,
  countries: (query: string) => ['countries', query] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  queueRoot: ['admin', 'queue'] as const,
  queue: (section: string, filter: string, search: string) =>
    ['admin', 'queue', section, filter, search] as const,
  detail: (kind: string, id: string) => ['admin', 'detail', kind, id] as const,
  history: (kind: string, id: string) =>
    ['admin', 'history', kind, id] as const,
  analyticsFoundation: (range: unknown) =>
    ['admin', 'analytics', 'foundation', range] as const,
};

export const commerceKeys = {
  lot: (publicId: string, viewerId: string | null) =>
    ['user', viewerId ?? 'anonymous', 'lot', publicId] as const,
  bids: (listingId: string) => ['bids', listingId] as const,
  orders: (role: string, state: string) =>
    ['user', 'orders', role, state] as const,
  order: (publicId: string) => ['user', 'order', publicId] as const,
  attention: () => ['user', 'attention'] as const,
  favorites: () => ['user', 'favorites'] as const,
  favorite: (productId: string) => ['user', 'favorite', productId] as const,
  contacts: () => ['user', 'contacts'] as const,
  notificationSettings: () => ['user', 'notification-settings'] as const,
};

function isLotQueryKey(queryKey: QueryKey, publicId?: string) {
  return (
    queryKey[0] === 'user' &&
    queryKey[2] === 'lot' &&
    (publicId === undefined || queryKey[3] === publicId)
  );
}

export async function invalidateWorkSurfaces(
  queryClient: QueryClient,
  input: { publicId?: string; sellerSlug?: string } = {},
): Promise<void> {
  const tasks = [
    queryClient.invalidateQueries({
      queryKey: input.publicId
        ? portfolioKeys.work(input.publicId)
        : portfolioKeys.workRoot,
    }),
    queryClient.invalidateQueries({ queryKey: portfolioKeys.works() }),
    queryClient.invalidateQueries({ queryKey: portfolioKeys.home }),
    queryClient.invalidateQueries({
      queryKey: input.sellerSlug
        ? portfolioKeys.author(input.sellerSlug)
        : portfolioKeys.authorRoot,
    }),
    queryClient.invalidateQueries({
      predicate: (query) => isLotQueryKey(query.queryKey, input.publicId),
    }),
  ];
  if (canWritePrivateCache(queryClient)) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: ownerWorkKeys.cabinet }),
      queryClient.invalidateQueries({ queryKey: ownerWorkKeys.detailRoot }),
    );
  }
  await Promise.all(tasks);
}

const authScopedRoots = new Set(['user', 'seller', 'admin']);

type AuthEpochState = {
  id: number;
  writesOpen: boolean;
};

const authEpochs = new WeakMap<QueryClient, AuthEpochState>();
const authEpochListeners = new WeakMap<QueryClient, Set<() => void>>();

function authEpochState(queryClient: QueryClient): AuthEpochState {
  return authEpochs.get(queryClient) ?? { id: 0, writesOpen: true };
}

function notifyAuthEpoch(queryClient: QueryClient) {
  authEpochListeners.get(queryClient)?.forEach((listener) => listener());
}

function beginSessionRetirement(queryClient: QueryClient): number {
  const next = authEpochState(queryClient).id + 1;
  authEpochs.set(queryClient, { id: next, writesOpen: false });
  notifyAuthEpoch(queryClient);
  return next;
}

function retirementStillOwns(
  queryClient: QueryClient,
  retirement: number,
): boolean {
  const state = authEpochState(queryClient);
  return state.id === retirement && !state.writesOpen;
}

function finishSessionRetirement(queryClient: QueryClient, retirement: number) {
  if (!retirementStillOwns(queryClient, retirement)) return;
  authEpochs.set(queryClient, { id: retirement + 1, writesOpen: true });
  notifyAuthEpoch(queryClient);
}

export function subscribeAuthEpoch(
  queryClient: QueryClient,
  listener: () => void,
): () => void {
  const listeners =
    authEpochListeners.get(queryClient) ?? new Set<() => void>();
  listeners.add(listener);
  authEpochListeners.set(queryClient, listeners);
  return () => {
    listeners.delete(listener);
  };
}

export function currentAuthEpoch(queryClient: QueryClient): number {
  return authEpochState(queryClient).id;
}

export function readAuthEpoch(queryClient: QueryClient): {
  id: number;
  writesOpen: boolean;
} {
  const state = authEpochState(queryClient);
  return { id: state.id, writesOpen: state.writesOpen };
}

export function advanceAuthEpoch(queryClient: QueryClient): number {
  const next = currentAuthEpoch(queryClient) + 1;
  authEpochs.set(queryClient, { id: next, writesOpen: true });
  notifyAuthEpoch(queryClient);
  return next;
}

export function isAuthScopedQueryKey(queryKey: QueryKey): boolean {
  const [root] = queryKey;

  return typeof root === 'string' && authScopedRoots.has(root);
}

export async function clearAuthScopedDataExceptSession(
  queryClient: QueryClient,
  retirement?: number,
): Promise<void> {
  const predicate = (query: { queryKey: QueryKey }) =>
    isAuthScopedQueryKey(query.queryKey) &&
    !(query.queryKey[0] === 'user' && query.queryKey[1] === 'me');

  await queryClient.cancelQueries({ predicate });
  if (retirement !== undefined && !retirementStillOwns(queryClient, retirement))
    return;
  queryClient.removeQueries({ predicate });
}

export function canWritePrivateCache(
  queryClient: QueryClient,
  epoch = currentAuthEpoch(queryClient),
): boolean {
  const state = authEpochState(queryClient);
  if (!state.writesOpen || epoch !== state.id) return false;
  const session = queryClient.getQueryState(authKeys.session);
  if (!session || session.data == null) return false;
  return true;
}

export async function refreshPrivateQuery(
  queryClient: QueryClient,
  queryKey: QueryKey,
  epoch = currentAuthEpoch(queryClient),
): Promise<void> {
  if (!canWritePrivateCache(queryClient, epoch)) return;
  await queryClient.cancelQueries({ queryKey });
  if (!canWritePrivateCache(queryClient, epoch)) return;
  await queryClient.invalidateQueries({ queryKey });
}

export async function clearAuthenticatedSession(
  queryClient: QueryClient,
): Promise<void> {
  const retirement = beginSessionRetirement(queryClient);
  await queryClient.cancelQueries({
    queryKey: authKeys.session,
    exact: true,
  });
  if (!retirementStillOwns(queryClient, retirement)) return;
  await clearAuthScopedDataExceptSession(queryClient, retirement);
  if (!retirementStillOwns(queryClient, retirement)) return;
  queryClient.setQueryData(authKeys.session, null);
  finishSessionRetirement(queryClient, retirement);
}

export async function replaceAuthenticatedSession(
  queryClient: QueryClient,
  user: unknown,
): Promise<void> {
  const retirement = beginSessionRetirement(queryClient);
  await queryClient.cancelQueries({
    queryKey: authKeys.session,
    exact: true,
  });
  if (!retirementStillOwns(queryClient, retirement)) return;
  await clearAuthScopedDataExceptSession(queryClient, retirement);
  if (!retirementStillOwns(queryClient, retirement)) return;
  queryClient.setQueryData(authKeys.session, user);
  finishSessionRetirement(queryClient, retirement);
  // A session now exists again: local draft writers may persist for it.
  issueDraftWriteLease(queryClient);
}

/**
 * Session-scoped lease for local draft writes (browser storage drafts).
 * The session owner drives it: `logout` in auth-provider retires the lease
 * before the network call; installing a replacement session issues a new
 * one. Writers capture the lease when scheduling a debounced write and
 * revalidate it at execution — a write pending across the boundary drops,
 * and re-scheduling before the next session cannot re-arm it, because a
 * retired lease yields null until a new session is installed.
 */
type DraftWriteLease = { generation: number; open: boolean };

const draftWriteLeases = new WeakMap<QueryClient, DraftWriteLease>();

function draftWriteLeaseState(queryClient: QueryClient): DraftWriteLease {
  return draftWriteLeases.get(queryClient) ?? { generation: 0, open: true };
}

export function captureDraftWriteLease(
  queryClient: QueryClient,
): number | null {
  const state = draftWriteLeaseState(queryClient);
  return state.open ? state.generation : null;
}

export function draftWriteLeaseIsValid(
  queryClient: QueryClient,
  lease: number | null,
): boolean {
  if (lease === null) return false;
  const state = draftWriteLeaseState(queryClient);
  return state.open && state.generation === lease;
}

export function retireDraftWriteLease(queryClient: QueryClient): void {
  const state = draftWriteLeaseState(queryClient);
  draftWriteLeases.set(queryClient, {
    generation: state.generation + 1,
    open: false,
  });
}

export function issueDraftWriteLease(queryClient: QueryClient): void {
  const state = draftWriteLeaseState(queryClient);
  draftWriteLeases.set(queryClient, {
    generation: state.generation + 1,
    open: true,
  });
}
