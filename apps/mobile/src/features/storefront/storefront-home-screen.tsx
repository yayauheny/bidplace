import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, YStack } from 'tamagui';

import { HeroSection } from '../../components/storefront/HeroSection';
import { ProductGrid } from '../../components/storefront/ProductGrid';
import { SectionHeading } from '../../components/storefront/SectionHeading';
import { AppButton, LoadingState, Screen } from '../../components/ui';
import { useApiClient } from '../../providers/api-provider';
import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { usePublicAuctionsQuery } from '../auctions/hooks';
import { demoProducts } from './demo-products';
import { mapAuctionListItemToStorefrontProduct } from './model';

export function StorefrontHomeScreen() {
  const api = useApiClient();
  const query = usePublicAuctionsQuery();
  const featuredProducts =
    query.data?.auctions.length
      ? query.data.auctions
          .slice(0, 4)
          .map((item) => mapAuctionListItemToStorefrontProduct(item, api.baseUrl))
      : demoProducts.slice(0, 4);

  return (
    <Screen>
      <YStack
        style={{
          width: '100%',
          maxWidth: mobileLayout.pageMaxWidth,
          alignSelf: 'center',
          gap: mobileSpacing[8],
        }}
      >
        <HeroSection imageUrl={demoProducts[0].imageUrl} />

        <YStack gap={mobileSpacing[5]}>
          <SectionHeading
            eyebrow="Editorial selection"
            title="Лоты, которые держат форму и читаются как самостоятельный продукт."
            description="Публичная витрина теперь ближе к lifestyle commerce, но опирается на реальные данные аукционов и не ломает auction flow."
          />
          {query.isLoading ? <LoadingState label="Готовим подборку" /> : <ProductGrid products={featuredProducts} />}
        </YStack>

        <YStack gap={mobileSpacing[5]}>
          <SectionHeading
            eyebrow="Почему это работает"
            title="Чистая сетка, спокойная типографика и единый визуальный язык для public, seller и admin."
            description="Мы убираем ощущение dashboard и переводим сервис в сторону аккуратного premium experience без потери серверной логики."
          />
          <Link href="/catalog" asChild>
            <Pressable>
              <AppButton buttonSize="large">Перейти в каталог</AppButton>
            </Pressable>
          </Link>
        </YStack>
      </YStack>
    </Screen>
  );
}
