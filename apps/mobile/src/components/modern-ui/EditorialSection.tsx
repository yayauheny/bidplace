import type { ReactNode } from 'react';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

export function EditorialSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x3,
        paddingVertical: designTokens.space.x2,
      }}
    >
      <AppText role="sectionTitle">{title}</AppText>
      {children}
    </View>
  );
}
