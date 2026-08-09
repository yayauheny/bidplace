import { useQuery } from '@tanstack/react-query';
import {
  ScrollView,
  View,
  useWindowDimensions,
  type DimensionValue,
} from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AuctionCard,
  AppText,
  PageHeader,
  PageState,
  ResilientRemoteImage,
} from '../../components/modern-ui';
import { getApiAssetUrl } from '../../lib/environment';
import { presentEnum, sellerTypeLabels } from '../../lib/presentation';
import { useApiClient } from '../../providers/api-provider';
import { getAuthorWorkColumnCount } from './author-layout';

function AuthorWorkGrid({
  products,
  columns,
}: {
  products: React.ComponentProps<typeof AuctionCard>['item'][];
  columns: 2 | 3;
}) {
  const cardWidth = `${(100 / columns).toFixed(4)}%` as DimensionValue;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        margin: -designTokens.space.x2,
      }}
    >
      {products.map((item) => (
        <View
          key={item.product.id}
          style={{ width: cardWidth, padding: designTokens.space.x2 }}
        >
          <AuctionCard item={item} />
        </View>
      ))}
    </View>
  );
}

function AuthorPhoto({ url, name }: { url: string; name: string }) {
  const style = {
    width: 120,
    height: 120,
    borderRadius: designTokens.radius.pill,
  };

  return (
    <ResilientRemoteImage
      uri={getApiAssetUrl(url)}
      component="AuthorPhoto"
      accessibilityLabel={`Фото автора ${name}`}
      fallbackLabel={`Фото автора недоступно: ${name}`}
      style={style}
      contentFit="cover"
    />
  );
}

export function PublicSellerScreen({ slug }: { slug: string }) {
  const api = useApiClient();
  const { width } = useWindowDimensions();
  const query = useQuery({
    queryKey: ['public-seller', slug],
    queryFn: () => api.sellers.getPublicDetail(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  let content: React.ReactNode;
  if (query.isLoading) {
    content = <PageState title="Загружаем профиль автора…" loading />;
  } else if (
    query.isError &&
    query.error instanceof ApiClientError &&
    query.error.kind === 'not_found'
  ) {
    content = (
      <PageState title="Автор не найден" message="Профиль больше недоступен." />
    );
  } else if (query.isError || !query.data) {
    content = (
      <PageState
        title="Не удалось загрузить профиль автора"
        retry={() => void query.refetch()}
      />
    );
  } else if (query.data.products.length === 0) {
    content = <PageState title="У автора пока нет опубликованных предметов" />;
  } else {
    content = (
      <AuthorWorkGrid
        products={query.data.products}
        columns={getAuthorWorkColumnCount(width)}
      />
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 960,
          alignSelf: 'center',
          padding: designTokens.space.x5,
          gap: designTokens.space.x5,
        }}
      >
        {query.data ? (
          <View style={{ gap: designTokens.space.x3 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: designTokens.space.x4,
              }}
            >
              <AuthorPhoto
                url={query.data.sellerProfile.profilePhotoUrl}
                name={query.data.sellerProfile.fullName}
              />
              <View style={{ flex: 1, gap: designTokens.space.x1 }}>
                <PageHeader title={query.data.sellerProfile.fullName} />
                <AppText role="metadata" tone="secondary">
                  {presentEnum(
                    query.data.sellerProfile.sellerType,
                    sellerTypeLabels,
                    'Автор',
                  )}{' '}
                  · {query.data.sellerProfile.country}
                </AppText>
              </View>
            </View>
            <AppText role="bodySmall" tone="secondary">
              {query.data.sellerProfile.shortDescription}
            </AppText>
            <AppText role="caption" tone="secondary">
              {query.data.sellerProfile.socialLink}
            </AppText>
          </View>
        ) : null}
        {content}
      </ScrollView>
    </AppShell>
  );
}
