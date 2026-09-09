import { useLocalSearchParams } from 'expo-router';
import type { PortfolioWorksQuery } from '@bidplace/contracts';

import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';

export default function PublicSellerRoute() {
  const { slug, sort } = useLocalSearchParams<{
    slug: string;
    sort?: PortfolioWorksQuery['sort'];
  }>();
  return (
    <PublicSellerScreen
      slug={slug}
      sort={sort === 'oldest' ? 'oldest' : 'newest'}
    />
  );
}
