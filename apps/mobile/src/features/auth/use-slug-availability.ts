import { newAccountSlugSchema } from '@bidplace/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useApiClient } from '../../providers/api-provider';

export type SlugAvailabilityStatus =
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

export type SlugAvailabilityResult = {
  slug: string;
  status: SlugAvailabilityStatus;
  error?: unknown;
};

export function visibleSlugAvailability(
  slug: string,
  result: SlugAvailabilityResult | null,
): SlugAvailabilityResult | null {
  const parsed = newAccountSlugSchema.safeParse(slug);
  if (!parsed.success || result?.slug !== parsed.data) return null;
  return result;
}

export function useSlugAvailability() {
  const api = useApiClient();
  const [result, setResult] = useState<SlugAvailabilityResult | null>(null);
  const request = useRef(0);
  const pending = useRef(false);

  const invalidate = useCallback(() => {
    request.current += 1;
    pending.current = false;
    setResult(null);
  }, []);

  const check = useCallback(async (slug: string) => {
    const parsed = newAccountSlugSchema.safeParse(slug);
    if (!parsed.success || pending.current) return null;
    const requested = parsed.data;
    const operation = request.current + 1;
    request.current = operation;
    pending.current = true;
    setResult({ slug: requested, status: 'checking' });

    try {
      const response = await api.auth.slugAvailability(requested);
      if (request.current !== operation) return null;
      const next: SlugAvailabilityResult = {
        slug: requested,
        status: response.available ? 'available' : 'taken',
      };
      setResult(next);
      return next;
    } catch (error) {
      if (request.current !== operation) return null;
      const next: SlugAvailabilityResult = {
        slug: requested,
        status: 'error',
        error,
      };
      setResult(next);
      return next;
    } finally {
      if (request.current === operation) pending.current = false;
    }
  }, [api]);

  useEffect(() => {
    return () => {
      request.current += 1;
      pending.current = false;
    };
  }, []);

  return { check, invalidate, result };
}
