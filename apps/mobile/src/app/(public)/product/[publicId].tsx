import { type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { type WorkContentTabId } from '../../../components/figma';
import { ProductScreen } from '../../../features/products/product-screen';
import { parseWorkTabParam } from '../../../features/products/work-screen-composition';

export default function ProductRoute() {
  const { publicId, tab } = useLocalSearchParams<{
    publicId: string;
    tab?: string | string[];
  }>();
  const { push } = useRouter();
  const activeTab = parseWorkTabParam(tab);

  const openTab = (nextTab: WorkContentTabId) => {
    push({
      pathname: '/product/[publicId]',
      params:
        nextTab === 'details' ? { publicId } : { publicId, tab: nextTab },
    } as Href);
  };

  return (
    <ProductScreen
      publicId={publicId}
      activeTab={activeTab}
      onTabChange={openTab}
    />
  );
}
