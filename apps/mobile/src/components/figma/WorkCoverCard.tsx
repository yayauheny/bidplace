import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { MotionPressable } from '../ui/MotionPressable';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { FigmaChip } from './FigmaChip';
import { CoverFrost } from './CoverFrost';
import {
  coverCardFocusStyle,
  coverCardFrameStyle,
  coverCardMediaStyle,
  coverCardOverlayLayerStyle,
  coverCardOverlayRowStyle,
  coverCardPressableStyle,
  coverCardSpec,
  coverCardSurfaceStyle,
} from './cover-card-style';
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
  const spec = coverCardSpec();

  return (
    <View testID="figma-work-cover-card" style={coverCardFrameStyle('work')}>
      <Link href={href} asChild>
        <MotionPressable
          accessibilityRole="link"
          accessibilityLabel={workCoverAccessibilityLabel(overlay)}
          preset="card"
          style={(state) => [
            coverCardPressableStyle('work'),
            coverCardSurfaceStyle('work'),
            coverCardFocusStyle(state.focused),
          ]}
        >
          <ResilientRemoteImage
            uri={getApiAssetUrl(imageUrl)}
            component="WorkCoverCard"
            accessibilityLabel={imageLabel}
            fallbackLabel={`Изображение недоступно: ${overlay.title}`}
            style={coverCardMediaStyle}
            contentFit={spec.contentFit}
          />
          <View style={coverCardOverlayLayerStyle('work')}>
            <CoverFrost imageUrl={imageUrl}>
              <View style={{ gap: spec.blockGap }}>
                <Text
                  numberOfLines={spec.titleMaxLines}
                  style={[
                    { color: figmaTokens.color.white },
                    figmaTokens.typography.coverTitle,
                  ]}
                >
                  {overlay.title}
                </Text>
                {showCommerceRow ? (
                  <View style={coverCardOverlayRowStyle()}>
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
              <View style={coverCardOverlayRowStyle()}>
                <FigmaChip label={`@${overlay.authorSlug}`} tone="onDark" />
                {overlay.status ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spec.rowGap,
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
    </View>
  );
}
