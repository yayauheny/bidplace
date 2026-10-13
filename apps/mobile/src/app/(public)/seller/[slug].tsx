import { useLocalSearchParams } from 'expo-router';

import { toPublicAuthorRouteState } from '../../../features/sellers/public-author-query';
import { PublicSellerScreen } from '../../../features/sellers/public-seller-screen';

export default function PublicSellerRoute() {
  const { slug, sort, category, categories } = useLocalSearchParams<{
    slug: string;
    sort?: string;
    category?: string;
    categories?: string;
  }>();
  const state = toPublicAuthorRouteState({ sort, category, categories });
  return (
    <PublicSellerScreen
      slug={slug}
      sort={state.sort}
      category={state.category}
      categoryIds={state.categories}
    />
  );
}
