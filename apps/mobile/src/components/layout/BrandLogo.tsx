import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { designTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../modern-ui';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const brandLogo = require('../../../assets/branding/bidplace-logo.png');

export function BrandLogo() {
  return (
    <Link href="/" asChild>
      <MotionPressable
        accessibilityRole="link"
        accessibilityLabel="bidplace — на главную"
        preset="icon"
        style={{
          width: designTokens.size.touch,
          height: designTokens.size.touch,
          minWidth: designTokens.size.touch,
          minHeight: designTokens.size.touch,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={brandLogo}
          contentFit="contain"
          style={{ width: 38, height: 30 }}
        />
      </MotionPressable>
    </Link>
  );
}
