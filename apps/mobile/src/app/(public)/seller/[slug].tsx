import { useLocalSearchParams } from 'expo-router';
import type { PortfolioWorksQuery } from '@bidplace/contracts';

import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';
import { firstQueryParam } from '../../../features/search/catalog-query';

export default function PublicSellerRoute() {
  const params = useLocalSearchParams<{
    slug: string;
    sort?: PortfolioWorksQuery['sort'];
    tab?: string | string[];
  }>();
  const slug = firstQueryParam(params.slug);
  const sort = firstQueryParam(params.sort) === 'oldest' ? 'oldest' : 'newest';
  return (
    <PublicSellerScreen
      slug={slug}
      sort={sort}
      tab={params.tab}
    />
  );
}
