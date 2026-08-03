import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { modernTokens } from '@bidplace/design-tokens';

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
        minHeight: modernTokens.size.buttonCompact + modernTokens.space.x3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: modernTokens.space.x3,
        borderTopWidth: 1,
        borderTopColor: modernTokens.color.border,
        backgroundColor: modernTokens.color.surface,
        paddingHorizontal: modernTokens.space.x5,
        paddingTop: modernTokens.space.x1,
        paddingBottom: Math.max(insets.bottom, modernTokens.space.x1),
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>{summary}</View>
      <View style={{ flexShrink: 1 }}>{children}</View>
    </View>
  );
}
