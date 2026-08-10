import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { designTokens } from '@bidplace/design-tokens';

export function BottomActionBar({
  summary,
  children,
}: {
  summary: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      testID="mobile-bottom-action-bar"
      style={{
        minHeight: designTokens.size.buttonCompact + designTokens.space.x3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: designTokens.space.x3,
        borderTopWidth: 1,
        borderTopColor: designTokens.color.border,
        backgroundColor: designTokens.color.surface,
        paddingHorizontal: designTokens.space.x5,
        paddingTop: designTokens.space.x1,
        paddingBottom: Math.max(insets.bottom, designTokens.space.x1),
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>{summary}</View>
      <View style={{ flexShrink: 1 }}>{children}</View>
    </View>
  );
}
