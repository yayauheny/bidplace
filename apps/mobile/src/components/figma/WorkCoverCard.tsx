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
          <CoverFrost imageUrl={imageUrl}>
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
            </View>
          </CoverFrost>
        </View>
      </MotionPressable>
    </Link>
  );
}
