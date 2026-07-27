import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { modernTokens } from '@bidplace/design-tokens';

export function BottomActionBar({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ gap: modernTokens.space.x3, borderTopWidth: 1, borderTopColor: modernTokens.color.border, backgroundColor: modernTokens.color.surface, paddingHorizontal: modernTokens.space.x5, paddingTop: modernTokens.space.x3, paddingBottom: Math.max(insets.bottom, modernTokens.space.x3) }}>{summary}{children}</View>;
}
