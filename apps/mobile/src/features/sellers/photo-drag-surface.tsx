import { createContext, useContext, type ReactNode } from 'react';
import { View } from 'react-native';

export const PhotoDragGestureContext = createContext<
  ((children: ReactNode) => ReactNode) | null
>(null);
export function PhotoDragSurface({ children }: { children: ReactNode }) {
  const gesture = useContext(PhotoDragGestureContext);
  // GestureDetector needs one native view when local/server preview layers overlap.
  return gesture
    ? gesture(
        <View collapsable={false} style={{ width: '100%', height: '100%' }}>
          {children}
        </View>,
      )
    : children;
}
