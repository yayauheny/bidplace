import type { ReactNode } from 'react';
import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

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
        gap: modernTokens.space.x3,
        paddingVertical: modernTokens.space.x2,
      }}
    >
      <AppText role="sectionTitle">{title}</AppText>
      {children}
    </View>
  );
}
