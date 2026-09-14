import type { ReactNode, RefObject } from 'react';
import { View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { FigmaGlassSurface } from './FigmaGlassSurface';

export function FloatingDockFrame({
  bottom,
  blurTarget,
  children,
}: {
  bottom: number;
  blurTarget: RefObject<View | null>;
  children: ReactNode;
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom,
        alignItems: 'center',
        zIndex: figmaTokens.layer.popover,
      }}
    >
      <FigmaGlassSurface
        preset="navigation"
        blurTarget={blurTarget}
        testID="figma-floating-dock"
        accessibilityLabel="Основная навигация"
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: figmaTokens.space.dockGap,
          padding: figmaTokens.space.dockPad - 0.5,
        }}
      >
        {children}
      </FigmaGlassSurface>
    </View>
  );
}
