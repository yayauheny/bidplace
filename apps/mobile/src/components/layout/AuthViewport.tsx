import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui';
import { BrandLogo } from './BrandLogo';
import { getAuthLayoutGutter, getAuthLayoutMode } from './auth-layout';

function AuthIntroduction({ compact }: { compact: boolean }) {
  return (
    <View
      style={{
        flex: compact ? undefined : 1,
        maxWidth: compact ? 620 : 480,
        gap: designTokens.space.x5,
      }}
    >
      <AppText role="metadata" tone="accent">
        BIDPLACE · АВТОРСКИЕ АУКЦИОНЫ
      </AppText>
      <AppText role={compact ? 'sectionTitle' : 'display'}>
        Искусство встречает своего следующего владельца.
      </AppText>
      <AppText role="body" tone="secondary" style={{ maxWidth: 440 }}>
        Войдите, чтобы делать ставки, следить за покупками или представить свои
        работы коллекционерам.
      </AppText>
    </View>
  );
}

export function AuthViewport({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const mode = getAuthLayoutMode(width);
  const compact = mode === 'stacked';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: designTokens.color.canvas,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: designTokens.layout.contentMaxWidth,
          minHeight: designTokens.size.header,
          alignSelf: 'center',
          justifyContent: 'center',
          paddingHorizontal: getAuthLayoutGutter(width),
        }}
      >
        <BrandLogo />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: getAuthLayoutGutter(width),
            paddingBottom: compact
              ? designTokens.space.x12
              : designTokens.space.x16,
            paddingTop: compact
              ? designTokens.space.x6
              : designTokens.space.x10,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              width: '100%',
              maxWidth: designTokens.layout.productDetailMaxWidth,
              alignSelf: 'center',
              flexDirection: compact ? 'column' : 'row',
              alignItems: compact ? 'stretch' : 'center',
              gap: compact ? designTokens.space.x10 : designTokens.space.x20,
            }}
          >
            <AuthIntroduction compact={compact} />
            <View
              style={{
                width: compact ? '100%' : 520,
                maxWidth: 520,
                alignSelf: compact ? 'center' : undefined,
              }}
            >
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
