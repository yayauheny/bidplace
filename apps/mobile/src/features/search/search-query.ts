import { useEffect, useState } from 'react';

export const SEARCH_DEBOUNCE_MS = 300;

export function normalizeSearchQuery(value: string): string {
  return value.trim();
}

export function searchRequestQuery(value: string): string | undefined {
  const query = normalizeSearchQuery(value);
  return query.length > 0 ? query : undefined;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}
