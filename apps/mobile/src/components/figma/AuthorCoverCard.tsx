import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { useReducedMotion } from '../../lib/reduced-motion';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { CoverFrost } from './CoverFrost';
import {
  authorCoverNameZoneStyle,
  coverArtworkFrameStyle,
  coverCardFrameStyle,
  coverChipRowStyle,
  coverFrostZoneStyle,
  coverOverlayPadStyle,
  type CoverCardFrameSize,
} from './cover-card-style';
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
  size,
  frameRadius,
  interaction = 'default',
}: AuthorCoverInput & {
  imageUrl: string;
  size?: CoverCardFrameSize;
  frameRadius?: number;
  interaction?: 'default' | 'static';
}) {
  const content = getAuthorCoverContent({ fullName, slug, tags });
  const reducedMotion = useReducedMotion();
  const emphasizeArtwork =
    interaction !== 'static' && !reducedMotion;

  return (
    <Link href={`/seller/${slug}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={authorCoverAccessibilityLabel(content)}
        preset="card"
        style={{
          ...coverCardFrameStyle('author', size, frameRadius),
          justifyContent: 'space-between',
        }}
      >
        {({ hovered, focused }) => (
          <>
            <View
              style={coverArtworkFrameStyle(
                emphasizeArtwork && (hovered || focused),
                frameRadius,
              )}
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
            </View>
            <View pointerEvents="none" style={coverFrostZoneStyle()}>
              <CoverFrost imageUrl={imageUrl} placement="authorTop" />
              <View style={authorCoverNameZoneStyle()}>
                <Text
                  numberOfLines={1}
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
            </View>
            <View pointerEvents="none" style={coverFrostZoneStyle()}>
              <CoverFrost imageUrl={imageUrl} placement="authorBottom" />
              <View style={coverOverlayPadStyle()}>
                <Text
                  numberOfLines={1}
                  style={[
                    { color: figmaTokens.color.white },
                    figmaTokens.typography.authorHandle,
                  ]}
                >
                  {content.handle}
                </Text>
                {content.tags.length > 0 ? (
                  <View style={coverChipRowStyle()}>
                    {content.tags.map((tag) => (
                      <View key={tag} style={{ flexShrink: 0 }}>
                        <FigmaChip label={tag} tone="onDark" />
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </>
        )}
      </MotionPressable>
    </Link>
  );
}
