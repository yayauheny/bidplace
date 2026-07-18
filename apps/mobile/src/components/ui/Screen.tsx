import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';

import { mobileLayout, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { AppHeader } from '../layout/AppHeader';

type ScreenProps = {
  children: ReactNode;
  mode?: 'public' | 'seller' | 'admin' | 'auth';
  scrollable?: boolean;
  showHeader?: boolean;
  /** Pass noPad for screens that manage their own padding (e.g. full-bleed gallery) */
  noPad?: boolean;
} & ComponentPropsWithoutRef<typeof YStack>;

export function Screen({
  children,
  mode = 'public',
  scrollable = true,
  showHeader = true,
  noPad = false,
  ...props
}: ScreenProps) {
  const palette = useAppThemePalette();
  const bg = palette.background;

  const content = (
    <YStack
      flex={1}
      style={{
        maxWidth: mobileLayout.pageMaxWidth,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: noPad ? 0 : mobileSpacing[4],
        paddingVertical: noPad ? 0 : mobileSpacing[4],
        backgroundColor: 'transparent',
      }}
      {...props}
    >
      {children}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <YStack style={{ flex: 1, backgroundColor: bg }}>
        {showHeader ? <AppHeader mode={mode} /> : null}
        {scrollable ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </YStack>
    </SafeAreaView>
  );
}
