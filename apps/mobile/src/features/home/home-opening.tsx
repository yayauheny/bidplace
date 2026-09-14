import { useRouter } from 'expo-router';
import { Platform, ScrollView, View, type TextStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton, WorkCoverCard } from '../../components/figma';
import { AppText, ResilientRemoteImage } from '../../components/ui';
import { getApiAssetUrl } from '../../lib/environment';
import { type HomeCuratorSelection } from './home-sections';

// RN web maps numberOfLines={1} to nowrap, which glues a seeded newline into
// one run. Line-clamp keeps the first logical line and lets the renderer ellipsize.
const openingBioWebClamp = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 1,
  whiteSpace: 'pre-line',
} as unknown as TextStyle;

export function HomeOpening({ selection }: { selection: HomeCuratorSelection }) {
  const router = useRouter();
  const image = selection.work.images[0];
  const note = selection.note?.trim() || null;

  return (
    <View
      nativeID="home-opening"
      style={{
        gap: designTokens.space.sectionGap,
        minWidth: 0,
        alignSelf: 'stretch',
      }}
    >
      <AppText role="sectionTitle" accessibilityRole="header">
        Открытие недели
      </AppText>
      <View
        style={{
          marginHorizontal: -designTokens.space.pageGutter,
          minWidth: 0,
          alignSelf: 'stretch',
          overflow: 'hidden',
        }}
      >
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: '100%', maxWidth: '100%' }}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: designTokens.space.pageGutter,
            paddingHorizontal: designTokens.space.pageGutter,
          }}
        >
          <View
            nativeID="home-opening-author"
            style={{
              width: designTokens.layout.openingAuthorWidth,
              gap: designTokens.space.sectionGap,
              flexShrink: 0,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <ResilientRemoteImage
                uri={getApiAssetUrl(selection.curator.profilePhotoUrl)}
                component="AuthorPhoto"
                accessibilityLabel={`Фото автора ${selection.curator.fullName}`}
                fallbackLabel={`Фото автора недоступно: ${selection.curator.fullName}`}
                style={{
                  width: designTokens.size.openingAvatar,
                  height: designTokens.size.openingAvatar,
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
                  gap: designTokens.space.authorRowGap,
                }}
              >
                <AppText role="authorRowHandle" numberOfLines={1}>
                  @{selection.curator.slug}
                </AppText>
                {selection.curator.shortDescription ? (
                  <AppText
                    role="authorRowBio"
                    tone="subtle"
                    numberOfLines={Platform.OS === 'web' ? undefined : 1}
                    ellipsizeMode="tail"
                    style={Platform.OS === 'web' ? openingBioWebClamp : undefined}
                  >
                    {selection.curator.shortDescription}
                  </AppText>
                ) : null}
              </View>
            </View>
            {note ? (
              <View
                nativeID="home-opening-note"
                style={{ gap: designTokens.space.editorialGap }}
              >
                <AppText
                  nativeID="home-opening-note-title"
                  role="editorialTitle"
                  accessibilityRole="header"
                >
                  Выбор куратора
                </AppText>
                <AppText role="editorial" tone="subdued">
                  {note}
                </AppText>
              </View>
            ) : null}
            <FigmaButton
              label="Смотреть профиль"
              variant="quiet"
              size="compact"
              onPress={() => router.push(`/seller/${selection.curator.slug}`)}
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
              authorSlug={selection.work.author.slug}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
