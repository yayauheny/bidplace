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
let nativePush: History['pushState'] | null = null;
let nativeReplace: History['replaceState'] | null = null;

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
  return readId(window.history.state);
}

function readId(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('id' in data)) return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function savedEntries(data: unknown): string[] | null {
  if (!data || typeof data !== 'object' || !('entries' in data)) return null;
  const saved = (data as { entries?: unknown }).entries;
  if (!Array.isArray(saved) || saved.length === 0) return null;
  if (!saved.every((item) => typeof item === 'string' && item.length > 0)) return null;
  return saved;
}

function restoreEntries() {
  const saved = savedEntries(window.history.state);
  const id = historyId();
  if (!saved || !id) return;
  const at = saved.lastIndexOf(id);
  if (at < 0) return;
  const savedIndex = (window.history.state as { index?: unknown }).index;
  entries = saved.slice();
  index = typeof savedIndex === 'number' && saved[savedIndex] === id ? savedIndex : at;
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

function writePosition(url?: string | URL | null) {
  if (!nativeReplace) return;
  const id = historyId();
  if (!id) return;
  const current = window.history.state;
  const base = current && typeof current === 'object' ? current : {};
  nativeReplace(
    { ...base, id, entries: entries.slice(), index },
    '',
    url === undefined ? `${window.location.pathname}${window.location.search}${window.location.hash}` : url,
  );
}

function onPopState(event: PopStateEvent) {
  const landedId = historyId();
  if (activeRestoreId) {
    const expectedId = activeRestoreId;
    activeRestoreId = null;
    if (landedId === expectedId) {
      const restored = landedId ? entries.lastIndexOf(landedId) : -1;
      if (restored >= 0) index = restored;
      writePosition();
      event.stopImmediatePropagation();
      return;
    }
  }
  const from = index;
  const to = landedId ? entries.lastIndexOf(landedId) : -1;
  const restoreId = entries[from];
  const delta = to >= 0 && restoreId ? from - to : 0;
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const result = dismissalFor(path);
  if (!result || result.decision === 'allow' || delta === 0 || !restoreId) {
    if (to >= 0) {
      index = to;
      writePosition();
    }
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
  restoreEntries();
  nativePush = window.history.pushState.bind(window.history);
  nativeReplace = window.history.replaceState.bind(window.history);
  window.history.pushState = (data, unused, url) => {
    rememberCurrent();
    const id = readId(data);
    if (id) {
      entries = entries.slice(0, index + 1);
      entries.push(id);
      index = entries.length - 1;
    }
    nativePush?.(
      data && typeof data === 'object' ? { ...data, entries: entries.slice(), index } : data,
      unused,
      url,
    );
    if (id) return;
    const pushed = historyId();
    if (!pushed) return;
    entries = entries.slice(0, index + 1);
    entries.push(pushed);
    index = entries.length - 1;
    writePosition(url);
  };
  window.history.replaceState = (data, unused, url) => {
    if (entries.length === 0) restoreEntries();
    const id = readId(data) ?? historyId();
    if (id) {
      if (entries.length === 0) {
        entries = [id];
        index = 0;
      } else {
        entries[index] = id;
      }
    }
    const current = window.history.state;
    const base = current && typeof current === 'object' ? current : {};
    nativeReplace?.(
      {
        ...base,
        ...(data && typeof data === 'object' ? data : {}),
        ...(id ? { id } : {}),
        entries: entries.slice(),
        index,
      },
      unused,
      url,
    );
  };
  rememberCurrent();
  window.addEventListener('popstate', onPopState, true);
}

ensureAuthBrowserHistory();
