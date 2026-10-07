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

let liveAuthHistory: AuthHistoryLive | null = null;
let listening = false;
let restoringHistory = false;

export function publishAuthHistory(next: AuthHistoryLive | null) {
  liveAuthHistory = next;
}

export function clearAuthHistory(id: string) {
  if (liveAuthHistory?.id === id) liveAuthHistory = null;
}

export function settleAuthHistory() {
  restoringHistory = false;
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

function onPopState(event: PopStateEvent) {
  if (restoringHistory) {
    restoringHistory = false;
    event.stopImmediatePropagation();
    return;
  }
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const result = dismissalFor(path);
  if (!result || result.decision === 'allow') return;
  result.live.rememberLeave(path);
  event.stopImmediatePropagation();
  restoringHistory = true;
  window.history.go(1);
  if (result.decision === 'confirm') result.live.confirm();
}

export function ensureAuthBrowserHistory() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', onPopState, true);
}

ensureAuthBrowserHistory();
