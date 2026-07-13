import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

type ScreenProps = {
  children: ReactNode;
} & ComponentPropsWithoutRef<typeof YStack>;

export function Screen({ children, ...props }: ScreenProps) {
  const palette = useAppThemePalette();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <YStack
        flex={1}
        style={{
          padding: mobileSpacing[4],
          backgroundColor: palette.background,
        }}
        {...props}
      >
        {children}
      </YStack>
    </SafeAreaView>
  );
}
