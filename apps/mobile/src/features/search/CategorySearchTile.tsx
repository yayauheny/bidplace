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
import { useAppTheme } from '../../providers/theme-provider';
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
  const palette = useAppTheme();
  return (
    <Link href={toPortfolioWorksHref({ category: id })} push asChild>
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
          ...interactiveHitFallbackStyle({ hovered, pressed, palette }),
        })}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 264 / 352,
            borderRadius: designTokens.radius.small,
            overflow: 'hidden',
            backgroundColor: palette.mutedFill,
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
