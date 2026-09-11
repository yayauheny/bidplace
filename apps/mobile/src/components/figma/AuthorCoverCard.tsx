import { Link } from 'expo-router';
import { Platform, Text, View, type ViewStyle } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { CoverFrost } from './CoverFrost';
import {
  authorCoverAccessibilityLabel,
  getAuthorCoverContent,
  type AuthorCoverInput,
} from './author-cover-fields';

export function AuthorCoverCard({
  fullName,
  slug,
  tags,
  imageUrl,
}: AuthorCoverInput & { imageUrl: string }) {
  const content = getAuthorCoverContent({ fullName, slug, tags });

  return (
    <Link href={`/seller/${slug}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={authorCoverAccessibilityLabel(content)}
        preset="card"
        style={{
          ...(Platform.OS === 'web'
            ? ({ containerType: 'inline-size' } as ViewStyle)
            : null),
          width: '100%',
          aspectRatio:
            figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
          overflow: 'hidden',
          borderRadius: figmaTokens.radius.authorCover,
          backgroundColor: figmaTokens.color.mutedFill,
          justifyContent: 'space-between',
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(imageUrl)}
          component="AuthorCoverCard"
          accessibilityLabel={`Фото автора ${fullName}`}
          fallbackLabel={`Фото автора недоступно: ${fullName}`}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
          contentFit="cover"
        />
        <CoverFrost imageUrl={imageUrl} placement="authorTop" />
        <CoverFrost imageUrl={imageUrl} placement="authorBottom" />
        <View
          style={{
            alignSelf: 'stretch',
            paddingTop: 20,
            paddingBottom: 12,
            paddingHorizontal: figmaTokens.space.coverPad,
          }}
        >
          <Text
            numberOfLines={2}
            style={[
              {
                color: figmaTokens.color.white,
                textAlign: 'center',
              },
              figmaTokens.typography.authorName,
            ]}
          >
            {content.fullName}
          </Text>
        </View>
        <View
          style={{
            padding: figmaTokens.space.coverPad,
            gap: figmaTokens.space.coverGap,
          }}
        >
          <Text
            style={[
              { color: figmaTokens.color.white },
              figmaTokens.typography.authorHandle,
            ]}
          >
            {content.handle}
          </Text>
          {content.tags.length > 0 ? (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: figmaTokens.space.chipGap,
              }}
            >
              {content.tags.map((tag) => (
                <FigmaChip key={tag} label={tag} tone="onDark" />
              ))}
            </View>
          ) : null}
        </View>
      </MotionPressable>
    </Link>
  );
}
