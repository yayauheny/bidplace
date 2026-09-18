import { type ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { OverlayDimmer } from '../../components/figma/OverlayDimmer';
import { filterSheetPanelStyle } from '../../components/figma/filter-sheet-style';

export function SearchOverlayLayer({
  surfaceId,
  onClose,
  children,
}: {
  surfaceId: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  return (
    <>
      <OverlayDimmer onPress={Platform.OS === 'web' ? undefined : onClose} />
      <View
        nativeID={surfaceId}
        testID="search-overlay"
        accessibilityViewIsModal
        accessibilityLabel="Поиск"
        style={filterSheetPanelStyle()}
        {...(Platform.OS === 'web'
          ? ({ role: 'dialog', 'aria-modal': true } as object)
          : {})}
      >
        {children}
      </View>
    </>
  );
}
