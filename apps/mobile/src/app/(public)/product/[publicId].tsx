import { type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { type WorkContentTabId } from '../../../components/figma';
import { ProductScreen } from '../../../features/products/product-screen';
import { parseWorkTabParam } from '../../../features/products/work-screen-composition';
import { firstQueryParam } from '../../../features/search/catalog-query';

export default function ProductRoute() {
  const params = useLocalSearchParams<{
    publicId: string;
    tab?: string | string[];
  }>();
  const publicId = firstQueryParam(params.publicId);
  const tab = params.tab;
  const { push } = useRouter();
  const activeTab = parseWorkTabParam(tab);

  const openTab = (nextTab: WorkContentTabId) => {
    if (!publicId) return;
    push({
      pathname: '/product/[publicId]',
      params:
        nextTab === 'details' ? { publicId } : { publicId, tab: nextTab },
    } as Href);
  };

  return (
    <ProductScreen
      publicId={publicId}
      tabParam={tab}
      activeTab={activeTab}
      onTabChange={openTab}
    />
  );
}
