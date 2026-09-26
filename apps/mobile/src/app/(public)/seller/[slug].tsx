import { useLocalSearchParams } from 'expo-router';

import { toPublicAuthorRouteState } from '../../../features/sellers/public-author-query';
import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';

export default function PublicSellerRoute() {
  const { slug, sort, category } = useLocalSearchParams<{
    slug: string;
    sort?: string;
    category?: string;
  }>();
  const state = toPublicAuthorRouteState({ sort, category });
  return (
    <PublicSellerScreen
      slug={slug}
      sort={state.sort}
      category={state.category}
    />
  );
}
