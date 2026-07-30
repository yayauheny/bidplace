import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable } from 'react-native';
import { modernTokens } from '@bidplace/design-tokens';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandMark = require('../../../assets/branding/bidplace-mark-light.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandWordmark = require(
  '../../../assets/branding/bidplace-wordmark-light.png',
);

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const source = compact ? brandMark : brandWordmark;
  const size = compact ? 32 : undefined;
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
        <Image
          source={source}
          contentFit="contain"
          style={
            compact
              ? { width: size, height: size }
              : { width: 180, height: 45 }
          }
        />
      </Pressable>
    </Link>
  );
}
