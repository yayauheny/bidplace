import { newAccountSlugSchema } from '@bidplace/contracts';
import { useEffect, useState } from 'react';

import { useApiClient } from '../../providers/api-provider';

export type SlugAvailabilityStatus = 'available' | 'taken';

export type SlugAvailabilityResult = {
  slug: string;
  status: SlugAvailabilityStatus;
};

export function visibleSlugAvailability(
  slug: string,
  result: SlugAvailabilityResult | null,
): SlugAvailabilityStatus | null {
  const parsed = newAccountSlugSchema.safeParse(slug);
  if (!parsed.success || result?.slug !== parsed.data) return null;
  return result.status;
}

export function useSlugAvailability(slug: string) {
  const api = useApiClient();
  const [result, setResult] = useState<SlugAvailabilityResult | null>(null);

  useEffect(() => {
    const parsed = newAccountSlugSchema.safeParse(slug);
    if (!parsed.success) return;
    const requested = parsed.data;
    let active = true;
    const timer = setTimeout(() => {
      void api.auth
        .slugAvailability(requested)
        .then((response) => {
          if (!active) return;
          setResult({
            slug: requested,
            status: response.available ? 'available' : 'taken',
          });
        })
        .catch(() => {
          if (!active) return;
          setResult((current) => (current?.slug === requested ? null : current));
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, slug]);

  return visibleSlugAvailability(slug, result);
}
