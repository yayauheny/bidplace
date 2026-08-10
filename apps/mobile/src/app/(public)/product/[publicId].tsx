import { type Href, useLocalSearchParams, useRouter } from 'expo-router';

import {
  parseProductTabParam,
  type ProductTabId,
} from '../../../components/ui';
import { ProductScreen } from '../../../features/products/product-screen';

export default function ProductRoute() {
  const { publicId, tab } = useLocalSearchParams<{
    publicId: string;
    tab?: string | string[];
  }>();
  const router = useRouter();
  const activeTab = parseProductTabParam(tab);

  const openTab = (nextTab: ProductTabId) => {
    const params =
      nextTab === 'about' ? { publicId } : { publicId, tab: nextTab };
    router.push({ pathname: '/product/[publicId]', params } as Href);
  };

  return (
    <ProductScreen
      publicId={publicId}
      activeTab={activeTab}
      onTabChange={openTab}
    />
  );
}
