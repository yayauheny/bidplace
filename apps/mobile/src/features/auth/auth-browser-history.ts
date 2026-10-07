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
let entries: string[] = [];
let index = 0;
let activeRestoreId: string | null = null;

export function publishAuthHistory(next: AuthHistoryLive | null) {
  liveAuthHistory = next;
}

export function clearAuthHistory(id: string) {
  if (liveAuthHistory?.id === id) liveAuthHistory = null;
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

function rememberCurrent() {
  const id = historyId();
  if (!id) return;
  if (entries.length === 0) {
    entries = [id];
    index = 0;
    return;
  }
  entries[index] = id;
}

function onPopState(event: PopStateEvent) {
  const landedId = historyId();
  if (activeRestoreId) {
    const expectedId = activeRestoreId;
    activeRestoreId = null;
    if (landedId === expectedId) {
      const restored = landedId ? entries.indexOf(landedId) : -1;
      if (restored >= 0) index = restored;
      event.stopImmediatePropagation();
      return;
    }
  }
  const from = index;
  const to = landedId ? entries.indexOf(landedId) : -1;
  const restoreId = entries[from];
  const delta = to >= 0 && restoreId ? from - to : 0;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const result = dismissalFor(path);
  if (!result || result.decision === 'allow' || delta === 0 || !restoreId) {
    if (to >= 0) index = to;
    return;
  }
  result.live.rememberLeave(path);
  event.stopImmediatePropagation();
  activeRestoreId = restoreId;
  window.history.go(delta);
  if (result.decision === 'confirm') result.live.confirm();
}

export function ensureAuthBrowserHistory() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  const pushState = window.history.pushState.bind(window.history);
  const replaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (data, unused, url) => {
    rememberCurrent();
    pushState(data, unused, url);
    const id = historyId();
    if (!id) return;
    entries = entries.slice(0, index + 1);
    entries.push(id);
    index = entries.length - 1;
  };
  window.history.replaceState = (data, unused, url) => {
    replaceState(data, unused, url);
    const id = historyId();
    if (!id) return;
    if (entries.length === 0) {
      entries = [id];
      index = 0;
      return;
    }
    entries[index] = id;
  };
  rememberCurrent();
  window.addEventListener('popstate', onPopState, true);
}

ensureAuthBrowserHistory();
