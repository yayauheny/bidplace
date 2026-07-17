import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '../../providers/api-provider';

export const publicSellerKeys = {
  detail: (slug: string) => ['sellers', 'public', slug] as const,
};

export function usePublicSellerDetailQuery(slug: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: publicSellerKeys.detail(slug),
    queryFn: () => api.sellers.getPublicDetail(slug),
    enabled: Boolean(slug),
  });
}
