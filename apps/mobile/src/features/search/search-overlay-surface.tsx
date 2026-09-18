import { type ReactNode } from 'react';
import { Modal, Platform, View } from 'react-native';

import { OverlayDimmer } from '../../components/figma/OverlayDimmer';
import { filterSheetPanelStyle } from '../../components/figma/filter-sheet-style';

export function SearchOverlaySurface({
  surfaceId,
  onClose,
  children,
}: {
  surfaceId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          position: 'relative',
          alignItems: 'center',
        }}
      >
        <OverlayDimmer onPress={onClose} />
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
      </View>
    </Modal>
  );
}
