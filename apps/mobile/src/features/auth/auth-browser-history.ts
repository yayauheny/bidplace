import { authNavigationDismissal, authRouteFromLocation } from './auth-dismissal';

export type AuthHistoryLive = {
  id: string;
  dirty: boolean;
  busy: boolean;
  protectEnteredData: boolean;
  released: () => boolean;
  completed: () => boolean;
  confirm: () => void;
  rememberLeave: (path: string) => void;
};

let liveAuthHistory: AuthHistoryLive | null = null;
let listening = false;
let currentId: string | null = null;
let currentIndex: number | null = null;
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
      protectEnteredData: live.protectEnteredData,
      targetRoute: authRouteFromLocation(path),
      released: false,
    }),
  };
}

function readId(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('id' in data)) return null;
  const id = (data as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function historyId(): string | null {
  return readId(window.history.state);
}

function positionFrom(data: unknown): number | null {
  if (!data || typeof data !== 'object' || !('index' in data)) return null;
  const index = (data as { index?: unknown }).index;
  return typeof index === 'number' && Number.isSafeInteger(index) && index >= 0 ? index : null;
}

function withoutHistoryList(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const next = { ...(data as Record<string, unknown>) };
  delete next.entries;
  return next;
}

function remember(id: string | null, index: number | null) {
  currentId = id;
  currentIndex = index;
}

function locationHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function stampCurrent(index: number) {
  if (!nativeReplace) return;
  const current = window.history.state;
  const id = readId(current);
  nativeReplace(
    { ...withoutHistoryList(current), ...(id ? { id } : {}), index },
    '',
    locationHref(),
  );
  remember(id, index);
}

function onPopState(event: PopStateEvent) {
  const landedId = historyId();
  const landedIndex = positionFrom(window.history.state);
  if (activeRestoreId) {
    const expectedId = activeRestoreId;
    activeRestoreId = null;
    if (landedId === expectedId) {
      remember(landedId, landedIndex ?? currentIndex);
      event.stopImmediatePropagation();
      return;
    }
  }
  const from = currentIndex;
  const restoreId = currentId;
  const delta = from !== null && landedIndex !== null && restoreId ? from - landedIndex : 0;
  const path = locationHref();
  const result = dismissalFor(path);
  if (!result || result.decision === 'allow' || delta === 0 || !restoreId) {
    remember(landedId ?? currentId, landedIndex);
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
  remember(historyId(), positionFrom(window.history.state));
  nativePush = window.history.pushState.bind(window.history);
  nativeReplace = window.history.replaceState.bind(window.history);
  window.history.pushState = (data, unused, url) => {
    let index = positionFrom(window.history.state) ?? currentIndex;
    if (index === null) {
      stampCurrent(0);
      index = 0;
    }
    const next = index + 1;
    const id = readId(data);
    nativePush?.(
      { ...withoutHistoryList(data), ...(id ? { id } : {}), index: next },
      unused,
      url,
    );
    remember(historyId(), next);
  };
  window.history.replaceState = (data, unused, url) => {
    const current = window.history.state;
    const index = positionFrom(current) ?? currentIndex ?? 0;
    const id = readId(data) ?? readId(current);
    nativeReplace?.(
      {
        ...withoutHistoryList(current),
        ...withoutHistoryList(data),
        ...(id ? { id } : {}),
        index,
      },
      unused,
      url,
    );
    remember(id, index);
  };
  window.addEventListener('popstate', onPopState, true);
}

ensureAuthBrowserHistory();
