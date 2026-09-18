import { Link } from 'expo-router';
import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui/AppText';
import { ImagePlaceholder } from '../../components/ui/ImagePlaceholder';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { toPortfolioWorksHref } from '../products/portfolio-works-query';

export function CategorySearchTile({
  id,
  slug,
  name,
  onPress,
}: {
  id: string;
  slug: string;
  name: string;
  onPress?: () => void;
}) {
  return (
    <Link href={toPortfolioWorksHref({ category: id })} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={name}
        accessibilityHint={slug}
        onPress={onPress}
        preset="card"
        style={{
          width: '100%',
          gap: figmaTokens.space.x2,
        }}
      >
        <View
          style={{
            width: '100%',
            aspectRatio: 120.67 / 121.89,
            borderRadius: figmaTokens.radius.small,
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
        </View>
        <AppText role="bodySmall" numberOfLines={2}>
          {name}
        </AppText>
      </MotionPressable>
    </Link>
  );
}
