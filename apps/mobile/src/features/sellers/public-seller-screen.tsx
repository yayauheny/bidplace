import { useQuery } from '@tanstack/react-query';
import { Link, type Href } from 'expo-router';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type DimensionValue,
} from 'react-native';

import { ApiClientError } from '@bidplace/api-client';
import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from '../../components/layout/AppShell';
import {
  AppText,
  AuctionCard,
  MotionPressable,
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
  columns: 1 | 2 | 3 | 4;
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
  return (
    <ResilientRemoteImage
      uri={getApiAssetUrl(url)}
      component="AuthorPhoto"
      accessibilityLabel={`Фото автора ${name}`}
      fallbackLabel={`Фото автора недоступно: ${name}`}
      style={{
        width: 112,
        height: 112,
        borderRadius: designTokens.radius.pill,
        borderWidth: 1,
        borderColor: designTokens.color.border,
      }}
      contentFit="cover"
    />
  );
}

function AuthorHero({
  compact,
  country,
  description,
  name,
  photoUrl,
  socialLink,
  type,
}: {
  compact: boolean;
  country: string;
  description: string;
  name: string;
  photoUrl: string;
  socialLink: string;
  type: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        gap: designTokens.space.x4,
        paddingBottom: designTokens.space.x12,
        paddingTop: designTokens.space.x10,
      }}
    >
      <AuthorPhoto url={photoUrl} name={name} />
      <View style={{ alignItems: 'center', gap: designTokens.space.x2 }}>
        <AppText
          role={compact ? 'screenTitle' : 'display'}
          style={{ textAlign: 'center' }}
        >
          {name}
        </AppText>
        <AppText role="metadata" tone="secondary">
          {type} · {country}
        </AppText>
      </View>
      <AppText
        role="body"
        tone="secondary"
        style={{ maxWidth: 720, textAlign: 'center' }}
      >
        {description}
      </AppText>
      <Link href={socialLink as Href} target="_blank" asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={`Открыть публичную страницу автора ${name}`}
          preset="button"
          style={{
            minHeight: designTokens.size.touch,
            justifyContent: 'center',
            borderRadius: designTokens.radius.pill,
            borderWidth: 1,
            borderColor: designTokens.color.border,
            backgroundColor: designTokens.color.surface,
            paddingHorizontal: designTokens.space.x4,
          }}
          interactionStyle={({ hovered, pressed }) => ({
            backgroundColor:
              hovered || pressed
                ? designTokens.color.surfaceStrong
                : designTokens.color.surface,
          })}
        >
          <AppText role="label">Страница автора</AppText>
        </MotionPressable>
      </Link>
    </View>
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
    content = <PageState title="У автора пока нет опубликованных работ" />;
  } else {
    content = (
      <View style={{ gap: designTokens.space.x6 }}>
        <AppText role="sectionTitle">Работы</AppText>
        <AuthorWorkGrid
          products={query.data.products}
          columns={getAuthorWorkColumnCount(width)}
        />
      </View>
    );
  }

  return (
    <AppShell>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal:
            width >= designTokens.breakpoint.desktopShell
              ? designTokens.layout.desktopGutter
              : designTokens.layout.mobileGutter,
          paddingBottom: designTokens.space.x20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            width: '100%',
            maxWidth: designTokens.layout.contentMaxWidth,
            alignSelf: 'center',
            gap: designTokens.space.x8,
          }}
        >
          {query.data ? (
            <AuthorHero
              compact={width < designTokens.breakpoint.compactHeader}
              country={query.data.sellerProfile.country}
              description={query.data.sellerProfile.shortDescription}
              name={query.data.sellerProfile.fullName}
              photoUrl={query.data.sellerProfile.profilePhotoUrl}
              socialLink={query.data.sellerProfile.socialLink}
              type={presentEnum(
                query.data.sellerProfile.sellerType,
                sellerTypeLabels,
                'Автор',
              )}
            />
          ) : null}
          {content}
        </View>
      </ScrollView>
    </AppShell>
  );
}
