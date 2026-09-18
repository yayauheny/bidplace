import { useEffect, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function normalizeSearchQuery(value: string): string {
  return value.trim();
}

export function searchRequestQuery(value: string): string | undefined {
  const query = normalizeSearchQuery(value);
  return query.length > 0 ? query : undefined;
}

export function scheduleDebouncedCallback(
  callback: () => void,
  delayMs: number,
): () => void {
  const timer = setTimeout(callback, delayMs);
  return () => clearTimeout(timer);
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const cancel = scheduleDebouncedCallback(
      () => setDebounced(value),
      delayMs,
    );
    return cancel;
  }, [delayMs, value]);

  return debounced;
}
