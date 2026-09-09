import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as ExpoLinking from 'expo-linking';
import { Link, type Href } from 'expo-router';
import {
  Platform,
  ScrollView,
  Share,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  AppText,
  AuctionCardGrid,
  MotionPressable,
  PageState,
  ProductGallery,
  type ProductTabId,
} from '../../components/ui';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import { useTrackListingView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { toProductScreenModel } from './portfolio-work-adapter';
import { PAYMENT_DELIVERY_STUB } from './payment-delivery-stub';

type DetailItem = { label: string; value: string };

export { PAYMENT_DELIVERY_STUB };

export function ProductScreen({
  publicId,
}: {
  publicId: string;
  activeTab?: ProductTabId;
  onTabChange?: (tab: ProductTabId) => void;
}) {
  const api = useApiClient();
  const [shareState, setShareState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const query = useQuery({
    queryKey: ['portfolio-work', publicId],
    queryFn: () => api.portfolio.getWork(publicId),
    retry: retryTransientPublicQuery,
  });

  useTrackListingView({
    productPublicId: publicId,
    sellerProfileId: query.data?.author.id,
    enabled: Boolean(query.data),
  });

  const shareProduct = async () => {
    const productUrl =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URL(`/product/${publicId}`, window.location.origin).toString()
        : ExpoLinking.createURL(`/product/${publicId}`);

    try {
      if (Platform.OS === 'web') {
        const shareNavigator = navigator as Navigator & {
          share?: (data: { url: string }) => Promise<void>;
        };
        if (shareNavigator.share) {
          await shareNavigator.share({ url: productUrl });
        } else {
          let copied = false;
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(productUrl);
              copied = true;
            } catch {
              copied = false;
            }
          }
          if (!copied) {
            const input = document.createElement('textarea');
            input.value = productUrl;
            input.setAttribute('readonly', '');
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            copied = document.execCommand('copy');
            input.remove();
          }
          if (!copied) throw new Error('Sharing is unavailable');
        }
      } else {
        await Share.share({ message: productUrl });
      }
      setShareState('success');
    } catch {
      setShareState('error');
    }
  };

  if (query.isLoading) {
    return (
      <AppShell>
        <PageState title="Загружаем работу…" loading />
      </AppShell>
    );
  }
  if (query.isError || !query.data) {
    return (
      <AppShell>
        <PageState
          title="Не удалось загрузить работу"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const model = toProductScreenModel(query.data);
  const product = model.product;
  const sellerProfile = model.sellerProfile;
  const relatedItems = model.relatedItems.filter(
    (item) => item.product.publicId !== product.publicId,
  );
  const detailItems: DetailItem[] = [
    product.technique ? { label: 'Техника', value: product.technique } : null,
    product.materials ? { label: 'Материал', value: product.materials } : null,
    product.dimensions ? { label: 'Размеры', value: product.dimensions } : null,
    product.year
      ? { label: 'Год создания', value: String(product.year) }
      : null,
    product.city ? { label: 'Город', value: product.city } : null,
  ].filter((item): item is DetailItem => item !== null);
  const chips = [product.technique, product.materials].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <AppShell>
      <ScrollView
        testID="product-scroll-view"
        contentContainerStyle={{ paddingBottom: designTokens.space.x5 }}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery images={product.images} label={product.title} />
        <View
          style={{
            paddingHorizontal: designTokens.space.pageGutter,
            paddingTop: designTokens.space.sectionGap,
            gap: designTokens.space.sectionGap,
          }}
        >
          <View style={{ gap: designTokens.space.x2 }}>
            <AppText role="sectionTitle">{product.title}</AppText>
            <Link
              href={
                {
                  pathname: '/seller/[slug]',
                  params: { slug: sellerProfile.slug },
                } as Href
              }
              asChild
            >
              <MotionPressable
                accessibilityRole="link"
                accessibilityLabel={`Открыть профиль автора ${sellerProfile.fullName}`}
                onPress={() => undefined}
                preset="button"
              >
                <AppText role="label">
                  {sellerProfile.fullName} · @{sellerProfile.slug}
                </AppText>
              </MotionPressable>
            </Link>
          </View>
          {chips.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: designTokens.space.chipGap,
              }}
            >
              {chips.map((chip) => (
                <FigmaChip key={chip} label={chip} tone="onLight" />
              ))}
            </View>
          ) : null}
          {product.story ? (
            <View style={{ gap: designTokens.space.x2 }}>
              <AppText role="label">История</AppText>
              <AppText role="body">{product.story}</AppText>
            </View>
          ) : null}
          {detailItems.length > 0 ? (
            <View style={{ gap: designTokens.space.x3 }}>
              <AppText role="label">Детали</AppText>
              {detailItems.map((item) => (
                <View key={item.label} style={{ gap: 2 }}>
                  <AppText role="caption" tone="secondary">
                    {item.label}
                  </AppText>
                  <AppText role="label">{item.value}</AppText>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ gap: designTokens.space.x2 }}>
            <AppText role="label">Оплата и доставка</AppText>
            <AppText role="bodySmall" tone="secondary">
              {PAYMENT_DELIVERY_STUB}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: designTokens.space.x3 }}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel="Поделиться работой"
              onPress={() => void shareProduct()}
              preset="button"
              style={{
                minHeight: designTokens.size.touch,
                flexDirection: 'row',
                alignItems: 'center',
                gap: designTokens.space.x2,
                paddingHorizontal: designTokens.space.buttonX,
                borderWidth: 1,
                borderColor: designTokens.color.ink,
                borderRadius: designTokens.radius.button,
              }}
            >
              <FigmaIcon name="copy" />
              <AppText role="button">
                {shareState === 'success'
                  ? 'Ссылка скопирована'
                  : shareState === 'error'
                    ? 'Не удалось поделиться'
                    : 'Поделиться'}
              </AppText>
            </MotionPressable>
          </View>
          {relatedItems.length > 0 ? (
            <View style={{ gap: designTokens.space.sectionGap }}>
              <AppText role="label">Другие работы автора</AppText>
              <AuctionCardGrid items={relatedItems} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}
