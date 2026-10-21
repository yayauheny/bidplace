import { type ReactNode, useRef } from 'react';
import { useIsFocused } from 'expo-router';
import { BlurTargetView } from 'expo-blur';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { FloatingDock } from '../figma/FloatingDock';
import { useAppTheme } from '../../providers/theme-provider';
import { DesktopHeader } from './DesktopHeader';
import { useDesktopNavigation } from './public-navigation';
import { useDockInset } from './use-dock-inset';

export function AppShell({
  children,
  bottomAction,
  hideDock = false,
}: {
  children: ReactNode;
  bottomAction?: ReactNode;
  hideDock?: boolean;
}) {
  const dockBlurTarget = useRef<View | null>(null);
  const isFocused = useIsFocused();
  const { reserve } = useDockInset();
  const palette = useAppTheme();
  const desktop = useDesktopNavigation();

  return (
    <SafeAreaView
      edges={hideDock ? undefined : ['top', 'left', 'right']}
      style={{
        flex: 1,
        backgroundColor: palette.canvas,
        overflow: 'visible',
      }}
    >
      {!hideDock && desktop ? <DesktopHeader active={isFocused} /> : null}
      <BlurTargetView
        ref={dockBlurTarget}
        testID="app-shell-content"
        style={{
          flex: 1,
          width: '100%',
          maxWidth:
            designTokens.layout.contentMax + 2 * designTokens.layout.gutter,
          paddingHorizontal: designTokens.layout.gutter,
          minWidth: 0,
          alignSelf: 'center',
          overflow: 'visible',
        }}
      >
        {children}
        {bottomAction ? (
          <View
            style={{
              paddingBottom: hideDock ? designTokens.space.x4 : reserve,
            }}
          >
            {bottomAction}
          </View>
        ) : null}
      </BlurTargetView>
      {!hideDock && !desktop && isFocused ? (
        // Focus only mounts the body-portaled dock so stacked screens do
        // not paint multiple docks. It must not change page content.
        <FloatingDock blurTarget={dockBlurTarget} />
      ) : null}
    </SafeAreaView>
  );
}
