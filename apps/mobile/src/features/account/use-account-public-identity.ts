import { useInfiniteQuery } from '@tanstack/react-query';

import type { portfolioAuthorSchema } from '@bidplace/contracts';

import { useApiClient } from '../../providers/api-provider';
import {
  sellerProfileGcMs,
  sellerProfileStaleMs,
} from '../sellers/seller-profile-data';
import { authorWorksBaseOptions } from '../sellers/use-author-works';

type PublicAuthor = typeof portfolioAuthorSchema._output;

/**
 * Публичная identity аккаунта: тот же cache/key/shape/queryFn, что у
 * публичного экрана автора (общие base options), author первой страницы,
 * без fetchNextPage. Только для APPROVED с валидным slug; suspended/candidate
 * кэш не читают. freshness — общие 60s/5min константы. Ошибка/загрузка
 * возвращаются отдельно: локальный retry, кабинет продолжает работать.
 */
export function useAccountPublicIdentity({
  enabled,
  slug,
}: {
  enabled: boolean;
  slug: string | null;
}) {
  const api = useApiClient();
  const query = useInfiniteQuery({
    ...authorWorksBaseOptions(api, slug ?? '', 'newest'),
    enabled: enabled && Boolean(slug),
    staleTime: sellerProfileStaleMs,
    gcTime: sellerProfileGcMs,
  });
  const author: PublicAuthor | null = query.data?.pages[0]?.author ?? null;
  return {
    author,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
