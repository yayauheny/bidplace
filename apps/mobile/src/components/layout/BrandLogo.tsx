import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { modernTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../modern-ui';

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
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="bidplace — на главную"
        preset="icon"
        style={{
          width: compact ? modernTokens.size.touch : undefined,
          height: compact ? modernTokens.size.touch : undefined,
          minWidth: modernTokens.size.touch,
          minHeight: modernTokens.size.touch,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: modernTokens.space.x2,
        }}
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
      </MotionPressable>
    </Link>
  );
}
