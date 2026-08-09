import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x5,
        borderRadius: designTokens.radius.panel,
        borderWidth: 1,
        borderColor: designTokens.color.border,
        backgroundColor: designTokens.color.surfaceWarm,
        padding: designTokens.space.x6,
      }}
    >
      <View style={{ gap: designTokens.space.x1 }}>
        <AppText role="cardTitle">{title}</AppText>
        {description ? (
          <AppText role="bodySmall" tone="secondary">
            {description}
          </AppText>
        ) : null}
      </View>
      <View style={{ gap: designTokens.space.x4 }}>{children}</View>
    </View>
  );
}
