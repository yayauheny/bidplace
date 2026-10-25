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
  coverArtworkFrameStyle,
  coverCaptionBlockStyle,
  coverCaptionCardFrameStyle,
  coverCardFrameStyle,
  coverChipRowStyle,
  coverFrostZoneStyle,
  coverOverlayPadStyle,
} from './cover-card-style';
import {
  getWorkCoverOverlay,
  workCoverAccessibilityLabel,
} from './work-cover-fields';

// Единый caption-рендерер caption-варианта: одинаковые bounds с любым media
// состоянием (cover/no-cover/error). Author — display label (не притворяется
// slug); title по Figma 7008:26967, до двух строк.
export function WorkCoverCaption({
  author,
  title,
}: {
  author: string;
  title: string;
}) {
  const palette = useAppTheme();
  return (
    <View style={coverCaptionBlockStyle()}>
      <Text
        numberOfLines={1}
        style={[
          { color: palette.inkStrong },
          designTokens.typography.coverCaptionAuthor,
        ]}
      >
        {author}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          { color: palette.textSubdued },
          designTokens.typography.coverCaptionTitle,
        ]}
      >
        {title}
      </Text>
    </View>
  );
}

export function WorkCoverCard({
  href,
  imageUrl,
  imageLabel,
  title,
  authorSlug,
  authorLabel,
  variant = 'overlay',
  onPress,
}: {
  href: `/product/${string}` | `/products/${string}`;
  imageUrl: string;
  imageLabel: string;
  title: string;
  authorSlug: string;
  /** Честный отображаемый автор caption-варианта (может быть fullName). */
  authorLabel?: string;
  variant?: 'overlay' | 'caption' | 'compact';
  onPress?: () => void;
}) {
  const overlay = getWorkCoverOverlay({ title, authorSlug });
  const blurTarget = useRef<View | null>(null);
  const reducedMotion = useReducedMotion();
  const palette = useAppTheme();
  const captionAuthor = authorLabel ?? overlay.authorSlug;

  if (variant !== 'overlay') {
    return (
      <Link href={href} asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={workCoverAccessibilityLabel({
            title: overlay.title,
            authorSlug: captionAuthor,
          })}
          preset="card"
          onPress={onPress}
          {...coverHitDataset()}
        >
          {({ hovered, focused }) => (
            <>
              <View
                style={coverCaptionCardFrameStyle(palette, variant)}
              >
                <View
                  style={coverArtworkFrameStyle(
                    !reducedMotion && (hovered || focused),
                    designTokens.radius.ownerCard,
                  )}
                >
                  <ResilientRemoteImage
                    uri={getApiAssetUrl(imageUrl)}
                    component="WorkCoverCard"
                    accessibilityLabel={imageLabel}
                    fallbackLabel={`Изображение недоступно: ${overlay.title}`}
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
              </View>
              <WorkCoverCaption
                author={variant === 'compact' && !authorLabel ? `@${captionAuthor}` : captionAuthor}
                title={overlay.title}
              />
            </>
          )}
        </MotionPressable>
      </Link>
    );
  }

  return (
    <Link href={href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={workCoverAccessibilityLabel(overlay)}
        preset="card"
        onPress={onPress}
        {...coverHitDataset()}
        style={coverCardFrameStyle('work', undefined, undefined, palette)}
      >
        {({ hovered, focused }) => (
          <>
            <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
              <View
                style={coverArtworkFrameStyle(
                  !reducedMotion && (hovered || focused),
                )}
              >
                <ResilientRemoteImage
                  uri={getApiAssetUrl(imageUrl)}
                  component="WorkCoverCard"
                  accessibilityLabel={imageLabel}
                  fallbackLabel={`Изображение недоступно: ${overlay.title}`}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>
            </BlurTargetView>
            <View
              pointerEvents="none"
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View style={coverFrostZoneStyle()}>
                <CoverFrost
                  placement="workBottom"
                  blurTarget={blurTarget}
                />
                <View style={coverOverlayPadStyle()}>
                  <Text
                    numberOfLines={2}
                    style={[
                      {
                        color: palette.white,
                      },
                      designTokens.typography.coverTitle,
                    ]}
                  >
                    {overlay.title}
                  </Text>
                  <View style={coverChipRowStyle()}>
                    <View style={{ flexShrink: 0 }}>
                      <FigmaChip
                        label={`@${overlay.authorSlug}`}
                        tone="onDark"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </MotionPressable>
    </Link>
  );
}
