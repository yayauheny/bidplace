import { Link } from 'expo-router';
import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

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
          borderRadius: figmaTokens.radius.cover,
          ...interactiveHitFallbackStyle({ hovered, pressed }),
        })}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 264 / 352,
            borderRadius: figmaTokens.radius.cover,
            overflow: 'hidden',
            backgroundColor: figmaTokens.color.mutedFill,
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
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: figmaTokens.space.x2,
              backgroundColor: 'rgba(41, 41, 41, 0.45)',
            }}
          >
            <AppText
              role="bodySmall"
              numberOfLines={2}
              style={{ color: figmaTokens.color.white }}
            >
              {name}
            </AppText>
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}
