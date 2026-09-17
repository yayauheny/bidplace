import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppShell } from './AppShell';
import { BrandLogo } from './BrandLogo';

export function AuthViewport({ children }: { children: ReactNode }) {
  return (
    <AppShell showSessionAlert={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: designTokens.space.pageGutter,
            paddingTop: designTokens.space.x6,
            paddingBottom: designTokens.space.x8,
            gap: designTokens.space.sectionGap,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <BrandLogo />
          <View style={{ width: '100%' }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
