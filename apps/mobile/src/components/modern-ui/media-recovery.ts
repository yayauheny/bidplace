export const mediaRetryDelaysMs = [1_000, 3_000, 8_000] as const;

export type MediaRecoveryState = {
  uri: string;
  failureCount: number;
  requestVersion: number;
  failed: boolean;
  exhausted: boolean;
};

export function createMediaRecoveryState(uri: string): MediaRecoveryState {
  return {
    uri,
    failureCount: 0,
    requestVersion: 0,
    failed: false,
    exhausted: false,
  };
}

export function recordMediaFailure(state: MediaRecoveryState): {
  state: MediaRecoveryState;
  attempt: number;
  retryDelayMs: number | null;
} {
  const attempt = state.failureCount + 1;
  const retryDelayMs = mediaRetryDelaysMs[attempt - 1] ?? null;

  return {
    state: {
      ...state,
      failureCount: attempt,
      failed: true,
      exhausted: retryDelayMs === null,
    },
    attempt,
    retryDelayMs,
  };
}

export function beginMediaRetry(state: MediaRecoveryState): MediaRecoveryState {
  return {
    ...state,
    failed: false,
    exhausted: false,
    requestVersion: state.requestVersion + 1,
  };
}

export function markMediaLoaded(state: MediaRecoveryState): MediaRecoveryState {
  return {
    ...state,
    failureCount: 0,
    failed: false,
    exhausted: false,
  };
}

export function beginManualMediaRetry(
  state: MediaRecoveryState,
): MediaRecoveryState {
  return {
    ...createMediaRecoveryState(state.uri),
    requestVersion: state.requestVersion + 1,
  };
}

export function addMediaCacheBust(uri: string, requestVersion: number): string {
  if (requestVersion === 0) return uri;

  const hashIndex = uri.indexOf('#');
  const path = hashIndex === -1 ? uri : uri.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : uri.slice(hashIndex);
  const separator = path.includes('?') ? '&' : '?';

  return `${path}${separator}media_retry=${requestVersion}${hash}`;
}

export function sanitizeMediaUrl(uri: string): string {
  try {
    const parsed = new URL(uri);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return uri.split(/[?#]/, 1)[0] ?? uri;
  }
}

export function sanitizeMediaError(message: string, uri: string): string {
  const safeUri = sanitizeMediaUrl(uri);

  return message
    .replace(/https?:\/\/[^\s)]+/g, (value) => sanitizeMediaUrl(value))
    .replace(uri, safeUri);
}
