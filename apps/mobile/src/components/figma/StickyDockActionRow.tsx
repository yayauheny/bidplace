import type { ReactNode } from 'react';
import { View } from 'react-native';

import { stickyDockActionRowStyle } from './sticky-dock-action-row';

export function StickyDockActionRow({
  children,
  testID = 'sticky-dock-action-row',
}: {
  children: ReactNode;
  testID?: string;
}) {
  return (
    <View testID={testID} style={stickyDockActionRowStyle()}>
      {children}
    </View>
  );
}
