import { Link } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { useReducedMotion } from '../../lib/reduced-motion';
import { useAppTheme } from '../../providers/theme-provider';
import { coverHitDataset } from '../ui/interactive-hit-style';
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
  const palette = useAppTheme();
  const emphasizeArtwork = interaction !== 'static' && !reducedMotion;
  const blurTarget = useRef<View | null>(null);

  return (
    <Link href={`/seller/${slug}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={authorCoverAccessibilityLabel(content)}
        preset="card"
        {...coverHitDataset()}
        style={{
          ...coverCardFrameStyle('author', size, frameRadius, palette),
          justifyContent: 'space-between',
        }}
      >
        {({ hovered, focused }) => (
          <>
            <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
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
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>
            </BlurTargetView>
            <View pointerEvents="none" style={coverFrostZoneStyle('top')}>
              <CoverFrost
                placement="authorTop"
                blurTarget={blurTarget}
              />
              <View style={authorCoverNameZoneStyle()}>
                <Text
                  numberOfLines={1}
                  style={[
                    {
                      color: palette.white,
                      textAlign: 'center',
                    },
                    designTokens.typography.authorName,
                  ]}
                >
                  {content.fullName}
                </Text>
              </View>
            </View>
            <View pointerEvents="none" style={coverFrostZoneStyle()}>
              <CoverFrost
                placement="authorBottom"
                blurTarget={blurTarget}
              />
              <View style={coverOverlayPadStyle()}>
                <Text
                  numberOfLines={1}
                  style={[
                    { color: palette.white },
                    designTokens.typography.authorHandle,
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
