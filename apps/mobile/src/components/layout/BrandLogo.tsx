import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Text, XStack } from 'tamagui';

import { mobileBrand } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

// Brand mark — raster PNG placed by founder at assets/brand-mark.png.
// If the file is absent, a fallback placeholder renders until it is provided.
let brandMark: ReturnType<typeof require> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  brandMark = require('../../../assets/brand-mark.png') as ReturnType<typeof require>;
} catch {
  brandMark = null;
}

type BrandLogoProps = {
  compact?: boolean;
  /** inverted = white mark + text for use on dark overlays */
  inverted?: boolean;
};

export function BrandLogo({ compact = false, inverted = false }: BrandLogoProps) {
  const palette = useAppThemePalette();
  const markSize = compact ? mobileBrand.markSizeCompact : mobileBrand.markSizeDefault;
  const textColor = inverted ? '#FFFFFF' : palette.color;

  return (
    <Link href="/" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="bidplace — на главную"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <XStack
          style={{
            alignItems: 'center',
            gap: mobileBrand.gap,
          }}
        >
          {brandMark ? (
            <Image
              source={brandMark}
              style={{
                width: markSize,
                height: markSize,
                // tintColor makes the monochrome mark adapt to dark overlay context
                tintColor: inverted ? '#FFFFFF' : undefined,
              }}
              contentFit="contain"
              accessibilityLabel="bidplace mark"
            />
          ) : (
            // Fallback placeholder until brand-mark.png is placed
            <View
              style={{
                width: markSize,
                height: markSize,
                borderWidth: 1.5,
                borderColor: textColor,
                borderRadius: 4,
              }}
            />
          )}
          <Text
            style={{
              fontFamily: mobileBrand.fontFamily,
              fontSize: mobileBrand.fontSize,
              fontWeight: mobileBrand.fontWeight,
              letterSpacing: mobileBrand.letterSpacing,
              color: textColor,
              // Live text — never raster
            }}
            accessibilityElementsHidden
          >
            bidplace
          </Text>
        </XStack>
      </Pressable>
    </Link>
  );
}
