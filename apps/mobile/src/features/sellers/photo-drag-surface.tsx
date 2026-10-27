import { createContext, useContext, type ReactNode } from 'react';

export const PhotoDragGestureContext = createContext<
  ((children: ReactNode) => ReactNode) | null
>(null);
export function PhotoDragSurface({ children }: { children: ReactNode }) {
  const gesture = useContext(PhotoDragGestureContext);
  return gesture ? gesture(children) : children;
}
