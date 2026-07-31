import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { modernTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import { AuctionCard, AppText, PageHeader, PageState } from '../../components/modern-ui';
import { getApiAssetUrl } from '../../lib/environment';
import { useApiClient } from '../../providers/api-provider';

export function PublicSellerScreen({ slug }: { slug: string }) {
  const api = useApiClient();
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
    content = <PageState title="Автор не найден" message="Профиль больше недоступен." />;
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
      <View style={{ gap: modernTokens.space.x4 }}>
        {query.data.products.map((item) => (
          <AuctionCard key={item.product.id} item={item} />
        ))}
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 960,
          alignSelf: 'center',
          padding: modernTokens.space.x5,
          gap: modernTokens.space.x5,
        }}
      >
        {query.data ? (
          <View style={{ gap: modernTokens.space.x3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: modernTokens.space.x3 }}>
              <Image
                source={{ uri: getApiAssetUrl(query.data.sellerProfile.profilePhotoUrl) }}
                accessibilityLabel={`Фото автора ${query.data.sellerProfile.fullName}`}
                style={{ width: 64, height: 64, borderRadius: modernTokens.radius.pill }}
              />
              <View style={{ flex: 1, gap: modernTokens.space.x1 }}>
                <PageHeader title={query.data.sellerProfile.fullName} />
                <AppText role="metadata" tone="secondary">
                  {query.data.sellerProfile.sellerType} · {query.data.sellerProfile.country}
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
