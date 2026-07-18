import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { mobileSpacing } from '../../theme/tokens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import { AppHeader } from '../layout/AppHeader';

type ScreenProps = {
  children: ReactNode;
  mode?: 'public' | 'seller' | 'admin' | 'auth';
  scrollable?: boolean;
  showHeader?: boolean;
} & ComponentPropsWithoutRef<typeof YStack>;

export function Screen({
  children,
  mode = 'public',
  scrollable = true,
  showHeader = true,
  ...props
}: ScreenProps) {
  const content = (
    <YStack
      flex={1}
      style={{
        padding: mobileSpacing[4],
        backgroundColor: 'transparent',
      }}
      {...props}
    >
      {children}
    </YStack>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F7F3' }}>
      <YStack style={{ flex: 1, backgroundColor: '#F8F7F3' }}>
        {showHeader ? <AppHeader mode={mode} /> : null}
        {scrollable ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>{content}</ScrollView>
        ) : (
          content
        )}
      </YStack>
    </SafeAreaView>
  );
}
