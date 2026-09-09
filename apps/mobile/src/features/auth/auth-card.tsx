import { type ReactNode } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <View style={{ width: '100%', gap: designTokens.space.x6 }}>
      <View style={{ gap: designTokens.space.x2 }}>
        <AppText role="sectionTitle">{title}</AppText>
        <AppText role="body" tone="secondary">
          {description}
        </AppText>
      </View>
      {children}
    </View>
  );
}
