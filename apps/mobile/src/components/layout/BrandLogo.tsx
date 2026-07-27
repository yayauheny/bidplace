import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { modernTokens } from '@bidplace/design-tokens';
import { AppText } from '../modern-ui';
let brandMark: ReturnType<typeof require> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  brandMark = require('../../../assets/brand-mark.png') as ReturnType<
    typeof require
  >;
} catch {
  brandMark = null;
}
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const size = compact ? 24 : 32;
  return (
    <Link href="/" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="bidplace — на главную"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: modernTokens.space.x2,
        })}
      >
        {brandMark ? (
          <Image
            source={brandMark}
            contentFit="contain"
            style={{ width: size, height: size }}
          />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: modernTokens.radius.small,
              borderWidth: 1,
              borderColor: modernTokens.color.ink,
            }}
          />
        )}
        {!compact ? <AppText role="cardTitle">bidplace</AppText> : null}
      </Pressable>
    </Link>
  );
}
