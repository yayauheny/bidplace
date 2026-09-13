import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton, WorkCoverCard } from '../../components/figma';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { type HomeWorkItem } from './home-sections';

const openingAuthorWidth = 280;
const openingAvatar = 54;

export function HomeOpening({ selection }: { selection: HomeWorkItem }) {
  const router = useRouter();
  const image = selection.work.images[0];

  return (
    <View nativeID="home-opening" style={{ gap: designTokens.space.sectionGap }}>
      <AppText role="sectionTitle" accessibilityRole="header">
        Открытие недели
      </AppText>
      <View style={{ marginHorizontal: -designTokens.space.pageGutter }}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            alignItems: 'flex-start',
            gap: designTokens.space.pageGutter,
            paddingHorizontal: designTokens.space.pageGutter,
          }}
        >
          <View
            nativeID="home-opening-author"
            style={{
              width: openingAuthorWidth,
              gap: designTokens.space.sectionGap,
              flexShrink: 0,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ResilientRemoteImage
                uri={getApiAssetUrl(selection.author.profilePhotoUrl)}
                component="AuthorPhoto"
                accessibilityLabel={`Фото автора ${selection.author.fullName}`}
                fallbackLabel={`Фото автора недоступно: ${selection.author.fullName}`}
                style={{
                  width: openingAvatar,
                  height: openingAvatar,
                  borderRadius: designTokens.radius.avatar,
                  overflow: 'hidden',
                }}
                contentFit="cover"
              />
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: designTokens.space.coverPad,
                  gap: 2,
                }}
              >
                <AppText role="authorName" numberOfLines={1}>
                  @{selection.author.slug}
                </AppText>
                {selection.author.shortDescription ? (
                  <AppText role="bodySmall" tone="muted" numberOfLines={1}>
                    {selection.author.shortDescription}
                  </AppText>
                ) : null}
              </View>
            </View>
            <FigmaButton
              label="Смотреть профиль"
              variant="muted"
              onPress={() =>
                router.push(`/seller/${selection.author.slug}`)
              }
            />
          </View>
          <View
            nativeID="home-opening-work"
            style={{
              width: designTokens.size.coverWidth,
              flexShrink: 0,
            }}
          >
            <WorkCoverCard
              href={`/product/${selection.work.publicId}`}
              imageUrl={image?.url ?? ''}
              imageLabel={selection.work.title}
              title={selection.work.title}
              authorSlug={selection.author.slug}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
