import { useQuery } from '@tanstack/react-query';

import { commerceKeys } from '../../lib/query-cache';
import { useApiClient } from '../../providers/api-provider';
import { useAuth } from '../../providers/auth-provider';

const FOCUS_MS = 60_000;

export function useDeals(role: 'buyer' | 'seller', enabled: boolean) {
  const api = useApiClient();
  const auth = useAuth();
  const open = useQuery({
    queryKey: commerceKeys.orders(role, 'open'),
    queryFn: ({ signal }) =>
      api.commerce.listOrders({ role, state: 'open' }, { signal }),
    enabled: auth.isAuthenticated && enabled,
    refetchInterval: FOCUS_MS,
  });
  const closed = useQuery({
    queryKey: commerceKeys.orders(role, 'closed'),
    queryFn: ({ signal }) =>
      api.commerce.listOrders({ role, state: 'closed' }, { signal }),
    enabled: auth.isAuthenticated && enabled,
    refetchInterval: FOCUS_MS,
  });
  return { open, closed };
}
