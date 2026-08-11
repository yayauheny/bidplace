import { useLocalSearchParams } from 'expo-router';
import type { PublicSellerWorksQuery } from '@bidplace/contracts';

import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';

export default function PublicSellerRoute() {
  const { slug, status, sort } = useLocalSearchParams<{
    slug: string;
    status?: 'LIVE' | 'SCHEDULED' | 'ENDED';
    sort?: PublicSellerWorksQuery['sort'];
  }>();
  return (
    <PublicSellerScreen
      slug={slug}
      status={status}
      sort={sort ?? 'activity'}
    />
  );
}
