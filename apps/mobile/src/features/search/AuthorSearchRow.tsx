import { Link } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui/AppText';
import {
  interactiveHitDataset,
  interactiveHitFallbackStyle,
} from '../../components/ui/interactive-hit-style';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { ResilientRemoteImage } from '../../components/ui/ResilientRemoteImage';
import { getApiAssetUrl } from '../../lib/environment';
import { useAppTheme } from '../../providers/theme-provider';
import { authorSearchRowStyle } from './author-search-row-style';

export function AuthorSearchRow({
  slug,
  profilePhotoUrl,
  shortDescription,
}: {
  slug: string;
  profilePhotoUrl: string;
  shortDescription: string;
}) {
  const handle = `@${slug}`;
  const palette = useAppTheme();

  return (
    <Link href={`/seller/${slug}`} asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel={handle}
        accessibilityHint={shortDescription}
        testID="author-search-row"
        preset="card"
        {...interactiveHitDataset()}
        style={({ hovered, pressed }) => ({
          width: '100%',
          ...interactiveHitFallbackStyle({ hovered, pressed, palette }),
        })}
      >
        <View style={authorSearchRowStyle()}>
          <View
            style={{
              width: designTokens.size.touch,
              height: designTokens.size.touch,
              borderRadius: designTokens.radius.avatar,
              overflow: 'hidden',
              backgroundColor: palette.mutedFill,
              flexShrink: 0,
            }}
          >
            <ResilientRemoteImage
              uri={getApiAssetUrl(profilePhotoUrl)}
              component="AuthorSearchRow"
              accessibilityLabel={handle}
              fallbackLabel={`Фото недоступно: ${handle}`}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          </View>
          <View
            style={{
              flex: 1,
              minWidth: 0,
              gap: designTokens.space.authorRowGap,
            }}
          >
            <AppText
              role="body"
              numberOfLines={1}
              style={{
                fontFamily: 'Inter_500Medium',
                fontWeight: '500',
              }}
            >
              {handle}
            </AppText>
            <AppText role="bodySmall" tone="secondary" numberOfLines={1}>
              {shortDescription}
            </AppText>
          </View>
        </View>
      </MotionPressable>
    </Link>
  );
}
