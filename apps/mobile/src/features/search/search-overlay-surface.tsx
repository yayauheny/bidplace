import { type ReactNode } from 'react';
import { Modal, View } from 'react-native';

import { SearchOverlayLayer } from './search-overlay-layer';

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
        <SearchOverlayLayer surfaceId={surfaceId} onClose={onClose}>
          {children}
        </SearchOverlayLayer>
      </View>
    </Modal>
  );
}
