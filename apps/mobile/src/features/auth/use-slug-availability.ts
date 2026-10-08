import { accountSlugSchema } from '@bidplace/contracts';
import { useEffect, useState } from 'react';

import { useApiClient } from '../../providers/api-provider';

export type SlugAvailabilityStatus = 'available' | 'taken';

export function useSlugAvailability(slug: string) {
  const api = useApiClient();
  const [status, setStatus] = useState<SlugAvailabilityStatus | null>(null);

  useEffect(() => {
    const parsed = accountSlugSchema.safeParse(slug);
    if (!parsed.success) {
      setStatus(null);
      return;
    }
    const requested = parsed.data;
    let active = true;
    const timer = setTimeout(() => {
      void api.auth
        .slugAvailability(requested)
        .then((result) => {
          if (active) setStatus(result.available ? 'available' : 'taken');
        })
        .catch(() => {
          if (active) setStatus(null);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, slug]);

  return status;
}
