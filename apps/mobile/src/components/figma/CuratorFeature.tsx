import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import {
  figmaButtonLabelColor,
  figmaButtonStyle,
} from './figma-button-style';
import { WorkCoverCard } from './WorkCoverCard';
import {
  CURATOR_AVATAR_SIZE,
  CURATOR_EDITORIAL_WIDTH,
  curatorFeatureContent,
  type CuratorSelection,
} from './curator-feature';

export function CuratorFeature({ selection }: { selection: CuratorSelection }) {
  const content = curatorFeatureContent(selection);

  return (
    <View style={{ gap: figmaTokens.space.sectionGap, width: '100%' }}>
      <Text
        style={[
          {
            color: figmaTokens.color.ink,
            paddingHorizontal: figmaTokens.space.pageGutter,
          },
          figmaTokens.typography.sectionTitle,
        ]}
      >
        {content.sectionTitle}
      </Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: figmaTokens.space.pageGutter,
          paddingHorizontal: figmaTokens.space.pageGutter,
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            width: CURATOR_EDITORIAL_WIDTH,
            gap: figmaTokens.space.sectionGap,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: figmaTokens.space.x2,
              alignItems: 'center',
            }}
          >
            <ResilientRemoteImage
              uri={getApiAssetUrl(content.authorPhotoUrl)}
              component="CuratorFeature"
              accessibilityLabel={`Фото автора ${content.authorName}`}
              fallbackLabel={`Фото автора недоступно: ${content.authorName}`}
              contentFit="cover"
              style={{
                width: CURATOR_AVATAR_SIZE,
                height: CURATOR_AVATAR_SIZE,
                borderRadius: figmaTokens.radius.avatar,
              }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[
                  { color: figmaTokens.color.ink },
                  figmaTokens.typography.authorName,
                ]}
              >
                {content.handle}
              </Text>
              {content.quote ? (
                <Text
                  numberOfLines={2}
                  style={[
                    { color: figmaTokens.color.ink },
                    figmaTokens.typography.bodySmall,
                  ]}
                >
                  {content.quote}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ gap: figmaTokens.space.fieldGap }}>
            <Text
              style={[
                { color: figmaTokens.color.ink },
                figmaTokens.typography.screenTitle,
              ]}
            >
              {content.curatorLabel}
            </Text>
            <Text
              style={[
                { color: figmaTokens.color.ink },
                figmaTokens.typography.body,
              ]}
            >
              {content.workTitle}
            </Text>
          </View>
          <Link href={content.profileHref} asChild>
            <MotionPressable
              accessibilityRole="link"
              accessibilityLabel={content.ctaLabel}
              preset="button"
              style={({ hovered, pressed }) => [
                { alignSelf: 'flex-start' },
                figmaButtonStyle(
                  'muted',
                  pressed ? 'pressed' : hovered ? 'hover' : 'idle',
                ),
              ]}
            >
              <Text
                style={[
                  { color: figmaButtonLabelColor('muted') },
                  figmaTokens.typography.button,
                ]}
              >
                {content.ctaLabel}
              </Text>
            </MotionPressable>
          </Link>
        </View>
        <View style={{ width: figmaTokens.size.coverWidth }}>
          <WorkCoverCard
            href={content.workHref}
            imageUrl={content.imageUrl}
            imageLabel={content.imageLabel}
            title={content.workTitle}
            authorSlug={content.authorSlug}
            mode="portfolio"
          />
        </View>
      </ScrollView>
    </View>
  );
}
