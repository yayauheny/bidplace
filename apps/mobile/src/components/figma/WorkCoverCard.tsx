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
  coverArtworkFrameStyle,
  coverCardFrameStyle,
  coverChipRowStyle,
  coverFrostZoneStyle,
  coverOverlayPadStyle,
} from './cover-card-style';
import {
  getWorkCoverOverlay,
  workCoverAccessibilityLabel,
} from './work-cover-fields';

export function WorkCoverCard({
  href,
  imageUrl,
  imageLabel,
  title,
  authorSlug,
}: {
  href: `/product/${string}`;
  imageUrl: string;
  imageLabel: string;
  title: string;
  authorSlug: string;
}) {
  const overlay = getWorkCoverOverlay({ title, authorSlug });
  const reducedMotion = useReducedMotion();

  return (
    <Link href={href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={workCoverAccessibilityLabel(overlay)}
        preset="card"
        style={coverCardFrameStyle('work')}
      >
        {({ hovered, focused }) => (
          <>
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
            <View
              pointerEvents="none"
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              <View style={coverFrostZoneStyle()}>
                <CoverFrost imageUrl={imageUrl} placement="workBottom" />
                <View style={coverOverlayPadStyle()}>
                  <Text
                    numberOfLines={2}
                    style={[
                      {
                        color: figmaTokens.color.white,
                      },
                      figmaTokens.typography.coverTitle,
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
