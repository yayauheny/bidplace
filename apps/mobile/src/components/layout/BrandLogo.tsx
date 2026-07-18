import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { Text, XStack } from 'tamagui';

import { fontFamilies, mobileRadius, mobileSpacing } from '../../theme/tokens';
import icon from '../../../assets/icon.png';

type BrandLogoProps = {
  compact?: boolean;
};

export function BrandLogo({ compact = false }: BrandLogoProps) {
  const size = compact ? 28 : 34;

  return (
    <Link href="/" asChild>
      <Pressable accessibilityRole="link" accessibilityLabel="На главную">
        <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
          <Image
            source={icon}
            style={{
              width: size,
              height: size,
              borderRadius: mobileRadius.sm,
            }}
            contentFit="cover"
          />
          {!compact ? (
            <Text
              color="$text"
              style={{
                fontFamily: fontFamilies.sansMedium,
                fontSize: 16,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Bidplace
            </Text>
          ) : null}
        </XStack>
      </Pressable>
    </Link>
  );
}
