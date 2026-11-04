import { useQuery } from '@tanstack/react-query';

import { commerceKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';

const FOCUS_MS = 60_000;

export function useOrder(publicId: string) {
  const api = useApiClient();
  const auth = useAuth();
  return useQuery({
    queryKey: commerceKeys.order(publicId),
    queryFn: ({ signal }) => api.commerce.getOrder(publicId, { signal }),
    enabled: auth.isAuthenticated && publicId.length > 0,
    refetchInterval: FOCUS_MS,
  });
}

export function useAttention() {
  const api = useApiClient();
  const auth = useAuth();
  return useQuery({
    queryKey: commerceKeys.attention(),
    queryFn: ({ signal }) => api.commerce.getAttention({ signal }),
    enabled: auth.isAuthenticated,
    refetchInterval: FOCUS_MS,
  });
}
