import { Link } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui/AppText';
import { ImagePlaceholder } from '../../components/ui/ImagePlaceholder';
import {
  interactiveHitDataset,
  interactiveHitFallbackStyle,
} from '../../components/ui/interactive-hit-style';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { toPortfolioWorksHref } from '../products/portfolio-works-query';

export function CategorySearchTile({
  id,
  slug,
  name,
}: {
  id: string;
  slug: string;
  name: string;
}) {
  return (
    <Link href={toPortfolioWorksHref({ category: id })} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={name}
        accessibilityHint={slug}
        testID="category-search-tile"
        preset="card"
        {...interactiveHitDataset()}
        style={({ hovered, pressed }) => ({
          width: '100%',
          gap: designTokens.space.x2,
          borderRadius: designTokens.radius.small,
          ...interactiveHitFallbackStyle({ hovered, pressed }),
        })}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 120.67 / 121.89,
            borderRadius: designTokens.radius.small,
            overflow: 'hidden',
            backgroundColor: designTokens.color.mutedFill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={{ width: 44, opacity: 0.4 }}
          >
            <ImagePlaceholder />
          </View>
        </View>
        <AppText role="bodySmall" numberOfLines={2}>
          {name}
        </AppText>
      </MotionPressable>
    </Link>
  );
}
