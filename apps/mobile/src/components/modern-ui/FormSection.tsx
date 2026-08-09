import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x4,
        borderRadius: designTokens.radius.panel,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
        padding: designTokens.space.x5,
      }}
    >
      <AppText role="metadata" tone="secondary">
        {title}
      </AppText>
      <View style={{ gap: designTokens.space.x3 }}>{children}</View>
    </View>
  );
}
