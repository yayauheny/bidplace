import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as ExpoLinking from 'expo-linking';
import { Link, type Href } from 'expo-router';
import {
  Platform,
  ScrollView,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout';
import {
  AppIcon,
  AppText,
  AuctionCardGrid,
  EditorialSection,
  PageState,
  ProductGallery,
  ResilientRemoteImage,
  type ProductTabId,
  MotionPressable,
} from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useTrackListingView } from '../../lib/analytics/use-track-views';
import { retryTransientPublicQuery } from '../../lib/query-retry';
import { useApiClient } from '../../providers/api-provider';
import { AboutAccordionRow, ProductAboutAuthorPanel } from './product-about';
import { getCatalogColumnCount } from './catalog-layout';
import { toProductScreenModel } from './portfolio-work-adapter';

type DetailItem = { label: string; value: string };

export function ProductScreen({
  publicId,
}: {
  publicId: string;
  activeTab: ProductTabId;
  onTabChange: (tab: ProductTabId) => void;
}) {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const isDesktop = width >= designTokens.breakpoint.desktopShell;
  const isProductWide = width >= designTokens.breakpoint.productDetailWide;
  const isHeroThreeColumn =
    width >= designTokens.breakpoint.productHeroThreeColumn;
  const productCanvasPadding =
    width >= designTokens.layout.productDetailMaxWidth
      ? 0
      : width >= designTokens.breakpoint.desktopShell
        ? designTokens.layout.tabletGutter
        : designTokens.layout.mobileGutter;
  const [shareState, setShareState] = useState<'idle' | 'success' | 'error'>(
    'idle',
  );
  const [openAboutSection, setOpenAboutSection] = useState<
    'characteristics' | null
  >('characteristics');

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

  if (query.isLoading)
    return (
      <AppShell ambientVariant="product">
        <PageState title="Загружаем предмет…" loading />
      </AppShell>
    );
  if (query.isError || !query.data)
    return (
      <AppShell ambientVariant="product">
        <PageState
          title="Не удалось загрузить предмет"
          retry={() => void query.refetch()}
        />
      </AppShell>
    );

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

  const itemStory = (
    <View
      style={{
        flexDirection: isProductWide ? 'row' : 'column',
        gap: designTokens.space.x6,
      }}
    >
      <View
        style={{
          width: isProductWide ? 832 : '100%',
          minHeight: isProductWide ? 620 : undefined,
          gap: designTokens.space.x5,
          paddingHorizontal: isProductWide ? 32 : 0,
          paddingVertical: isProductWide ? 28 : 0,
          borderRadius: isProductWide
            ? designTokens.radius.aboutPanel
            : undefined,
          backgroundColor: isProductWide
            ? designTokens.color.surfacePanel
            : 'transparent',
        }}
      >
        <AppText role="sectionTitle">О работе</AppText>
        {product.story ? <AppText role="body">{product.story}</AppText> : null}
        <View>
          <AboutAccordionRow
            index={1}
            label="Характеристики"
            expanded={openAboutSection === 'characteristics'}
            onToggle={() =>
              setOpenAboutSection((current) =>
                current === 'characteristics' ? null : 'characteristics',
              )
            }
            body={
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: designTokens.space.x5,
                }}
              >
                {detailItems.map((item) => (
                  <View
                    key={item.label}
                    style={{
                      minWidth: 120,
                      flex: 1,
                      gap: designTokens.space.x1,
                    }}
                  >
                    <AppText role="caption" tone="secondary">
                      {item.label}
                    </AppText>
                    <AppText role="label">{item.value}</AppText>
                  </View>
                ))}
              </View>
            }
          />
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: designTokens.color.border,
            }}
          />
        </View>
      </View>
      {isProductWide ? (
        <ProductAboutAuthorPanel
          profile={{
            fullName: sellerProfile.fullName,
            slug: sellerProfile.slug,
            profilePhotoUrl: sellerProfile.profilePhotoUrl,
            shortDescription: sellerProfile.shortDescription,
          }}
        />
      ) : null}
    </View>
  );
  const relatedWorksSection =
    relatedItems.length > 0 ? (
      <EditorialSection title={`Другие работы ${sellerProfile.fullName}`}>
        <AuctionCardGrid
          items={relatedItems}
          columns={getCatalogColumnCount(width)}
        />
      </EditorialSection>
    ) : null;

  return (
    <AppShell ambientVariant="product">
      <ScrollView
        testID="product-scroll-view"
        contentContainerStyle={{
          paddingVertical: designTokens.space.x6,
          paddingBottom: designTokens.space.x8,
        }}
        style={{ backgroundColor: 'transparent' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%' }}>
          <View
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: designTokens.layout.productDetailMaxWidth,
              alignSelf: 'center',
              minHeight: isHeroThreeColumn ? 780 : undefined,
              paddingHorizontal: productCanvasPadding,
              paddingTop: isDesktop
                ? designTokens.space.x3
                : designTokens.space.x6,
              paddingBottom: isDesktop
                ? designTokens.space.x12
                : designTokens.space.x8,
            }}
          >
            <View
              style={{
                position: 'relative',
                width: isHeroThreeColumn
                  ? designTokens.layout.productHeroContentWidth
                  : '100%',
                alignSelf: 'center',
                flexDirection: isHeroThreeColumn ? 'row' : 'column',
                alignItems: isHeroThreeColumn ? 'flex-start' : 'stretch',
                justifyContent: isHeroThreeColumn
                  ? 'space-between'
                  : 'flex-start',
                gap: isDesktop ? designTokens.space.x8 : designTokens.space.x6,
              }}
            >
              <View
                style={{
                  width: isHeroThreeColumn ? 328 : '100%',
                  minWidth: 0,
                  paddingTop: isHeroThreeColumn ? 165 : 0,
                  gap: designTokens.space.x5,
                }}
              >
                <AppText
                  role={isDesktop ? 'display' : 'screenTitle'}
                  style={
                    isDesktop
                      ? {
                          fontFamily: 'Onest_700Bold',
                          fontSize: 48,
                          lineHeight: 50,
                          letterSpacing: -1.2,
                        }
                      : undefined
                  }
                >
                  {product.title}
                </AppText>
                {product.story ? (
                  <AppText role="body" tone="secondary" numberOfLines={5}>
                    {product.story}
                  </AppText>
                ) : null}
              </View>
              <View
                style={{
                  width: isHeroThreeColumn ? 520 : '100%',
                  minWidth: 0,
                  alignItems: isHeroThreeColumn ? 'center' : 'stretch',
                  gap: designTokens.space.x8,
                }}
              >
                <ProductGallery
                  images={product.images}
                  label={product.title}
                />
              </View>
              <View
                style={{
                  width: isHeroThreeColumn ? 312 : '100%',
                  maxWidth: '100%',
                  paddingTop: isHeroThreeColumn ? 102 : 0,
                  gap: designTokens.space.x5,
                }}
              >
                <View style={{ gap: designTokens.space.x4 }}>
                  {detailItems.map((item) => (
                    <View
                      key={item.label}
                      style={{ gap: designTokens.space.x1 }}
                    >
                      <AppText role="caption" tone="secondary">
                        {item.label}
                      </AppText>
                      <AppText role="label">{item.value}</AppText>
                    </View>
                  ))}
                </View>
                <View style={{ gap: designTokens.space.x2 }}>
                  <AppText role="caption" tone="secondary">
                    Автор
                  </AppText>
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
                      style={{
                        minHeight: designTokens.size.touch,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: designTokens.space.x2,
                      }}
                    >
                      <ResilientRemoteImage
                        uri={getApiAssetUrl(sellerProfile.profilePhotoUrl)}
                        component="ProductAuthor"
                        accessibilityLabel={`Фото автора: ${sellerProfile.fullName}`}
                        fallbackLabel={`Фото автора недоступно: ${sellerProfile.fullName}`}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        contentFit="cover"
                      />
                      <AppText role="label">@{sellerProfile.slug}</AppText>
                      <AppIcon name="chevronRight" size={16} />
                    </MotionPressable>
                  </Link>
                </View>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel="Поделиться предметом"
                  onPress={() => void shareProduct()}
                  preset="button"
                  style={{
                    height: 36,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: designTokens.space.x2,
                    borderWidth: 1,
                    borderColor: designTokens.color.border,
                    borderRadius: designTokens.radius.button,
                    paddingHorizontal: designTokens.space.x3,
                  }}
                >
                  <AppIcon name="share" size={15} />
                  <AppText role="button">
                    {shareState === 'success'
                      ? 'Ссылка скопирована'
                      : shareState === 'error'
                        ? 'Не удалось поделиться'
                        : 'Поделиться'}
                  </AppText>
                </MotionPressable>
              </View>
            </View>
          </View>
          <View
            style={{
              width: '100%',
              backgroundColor: designTokens.color.surfaceWarm,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: designTokens.layout.productDetailMaxWidth,
                alignSelf: 'center',
                gap: designTokens.space.x6,
                paddingHorizontal: productCanvasPadding,
                paddingBottom: designTokens.space.x8,
              }}
            >
              {itemStory}
              {relatedWorksSection}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}
