import { Link } from 'expo-router';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { BidplaceMark } from '../branding/BidplaceBrand';
import { MotionPressable } from '../ui';

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
        <View pointerEvents="none">
          <BidplaceMark />
        </View>
      </MotionPressable>
    </Link>
  );
}
