import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { CoverFrost } from './CoverFrost';
import {
  getWorkCoverOverlay,
  workCoverAccessibilityLabel,
  workCoverStatusLabel,
  type WorkCoverInput,
  type WorkCoverMode,
  type WorkCoverStatus,
} from './work-cover-fields';

const statusDot: Record<Exclude<WorkCoverStatus, 'ended'>, string> = {
  live: figmaTokens.color.saleLive,
  announce: figmaTokens.color.saleAnnounce,
};

export function WorkCoverCard({
  href,
  imageUrl,
  imageLabel,
  mode = 'portfolio',
  ...input
}: WorkCoverInput & {
  href: `/product/${string}`;
  imageUrl: string;
  imageLabel: string;
  mode?: WorkCoverMode;
}) {
  const overlay = getWorkCoverOverlay(input, mode);
  const showCommerceRow = Boolean(overlay.price || overlay.timer);

  return (
    <Link href={href} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={workCoverAccessibilityLabel(overlay)}
        preset="card"
        style={{
          width: '100%',
          aspectRatio: figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
          overflow: 'hidden',
          borderRadius: figmaTokens.radius.cover,
          backgroundColor: figmaTokens.color.mutedFill,
        }}
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
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <CoverFrost imageUrl={imageUrl} imageLabel={imageLabel}>
            <View style={{ gap: figmaTokens.space.coverBlockGap }}>
              <Text
                numberOfLines={2}
                style={[
                  { color: figmaTokens.color.white },
                  figmaTokens.typography.coverTitle,
                ]}
              >
                {overlay.title}
              </Text>
              {showCommerceRow ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: figmaTokens.space.chipGap,
                  }}
                >
                  {overlay.price ? (
                    <Text
                      style={[
                        { color: figmaTokens.color.white },
                        figmaTokens.typography.coverPrice,
                      ]}
                    >
                      {overlay.price}
                    </Text>
                  ) : (
                    <View />
                  )}
                  {overlay.timer ? (
                    <Text
                      style={[
                        { color: figmaTokens.color.white },
                        figmaTokens.typography.coverMeta,
                      ]}
                    >
                      {overlay.timer}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: figmaTokens.space.chipGap,
              }}
            >
              <FigmaChip label={`@${overlay.authorSlug}`} tone="onDark" />
              {overlay.status ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: figmaTokens.space.chipX,
                    paddingVertical: figmaTokens.space.chipY,
                    borderRadius: figmaTokens.radius.chip,
                    backgroundColor: figmaTokens.color.chip,
                    borderWidth: 1,
                    borderColor: figmaTokens.color.chipOutline,
                  }}
                >
                  {overlay.status !== 'ended' ? (
                    <View
                      style={{
                        width: figmaTokens.size.statusDot,
                        height: figmaTokens.size.statusDot,
                        borderRadius: figmaTokens.radius.statusDot,
                        backgroundColor: statusDot[overlay.status],
                      }}
                    />
                  ) : null}
                  <Text
                    style={[
                      { color: figmaTokens.color.white },
                      figmaTokens.typography.chip,
                    ]}
                  >
                    {workCoverStatusLabel(overlay.status)}
                  </Text>
                </View>
              ) : null}
            </View>
          </CoverFrost>
        </View>
      </MotionPressable>
    </Link>
  );
}
