import { authNavigationDismissal, authRouteFromLocation } from './auth-dismissal';

export type AuthHistoryLive = {
  id: string;
  dirty: boolean;
  busy: boolean;
  released: () => boolean;
  completed: () => boolean;
  confirm: () => void;
  rememberLeave: (path: string) => void;
};

type HistoryTraverse = {
  restoreId: string;
  delta: number;
};

type NavigationDestination = { index?: number; url?: string };

type AppNavigation = {
  currentEntry?: { index?: number };
  addEventListener: (
    type: 'navigate',
    listener: (event: Event) => void,
  ) => void;
};

let liveAuthHistory: AuthHistoryLive | null = null;
let listening = false;
let pendingTraverse: HistoryTraverse | null = null;
let activeRestoreId: string | null = null;

export function publishAuthHistory(next: AuthHistoryLive | null) {
  liveAuthHistory = next;
}

export function clearAuthHistory(id: string) {
  if (liveAuthHistory?.id === id) liveAuthHistory = null;
}

export function settleAuthHistory() {
  pendingTraverse = null;
}

function dismissalFor(path: string) {
  const live = liveAuthHistory;
  if (!live || live.released() || live.completed()) return null;
  return {
    live,
    decision: authNavigationDismissal({
      dirty: live.dirty,
      busy: live.busy,
      targetRoute: authRouteFromLocation(path),
      released: false,
    }),
  };
}

function historyId(): string | null {
  const id = window.history.state?.id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function locationPath(url: string | undefined): string {
  if (!url) {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }
  const parsed = new URL(url, window.location.origin);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function onNavigate(event: Event) {
  if (activeRestoreId) return;
  const traverse = event as Event & {
    navigationType?: string;
    destination?: NavigationDestination;
  };
  pendingTraverse = null;
  if (traverse.navigationType !== 'traverse') return;
  const navigation = (window as Window & { navigation?: AppNavigation }).navigation;
  const fromIndex = navigation?.currentEntry?.index;
  const toIndex = traverse.destination?.index;
  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') return;
  const delta = fromIndex - toIndex;
  const restoreId = historyId();
  if (delta === 0 || !restoreId) return;
  const result = dismissalFor(locationPath(traverse.destination?.url));
  if (!result || result.decision === 'allow') return;
  pendingTraverse = { restoreId, delta };
}

function onPopState(event: PopStateEvent) {
  const landedId = historyId();
  if (activeRestoreId) {
    const expectedId = activeRestoreId;
    activeRestoreId = null;
    if (landedId === expectedId) {
      event.stopImmediatePropagation();
      return;
    }
  }
  const traverse = pendingTraverse;
  pendingTraverse = null;
  if (!traverse) return;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const result = dismissalFor(path);
  if (!result || result.decision === 'allow') return;
  result.live.rememberLeave(path);
  event.stopImmediatePropagation();
  activeRestoreId = traverse.restoreId;
  window.history.go(traverse.delta);
  if (result.decision === 'confirm') result.live.confirm();
}

export function ensureAuthBrowserHistory() {
  if (listening || typeof window === 'undefined') return;
  const navigation = (window as Window & { navigation?: AppNavigation }).navigation;
  if (!navigation) return;
  listening = true;
  navigation.addEventListener('navigate', onNavigate);
  window.addEventListener('popstate', onPopState, true);
}

ensureAuthBrowserHistory();
