import type { ReactNode } from 'react';
import type { PhotoDragPreview } from './sortable-photo-tile';
export type PhotoDropAreaProps = {
  children: ReactNode;
  preview?: PhotoDragPreview | null;
  onPreview?: (value: PhotoDragPreview | null) => void;
  onMove?: (id: string, index: number) => void;
};
export function PhotoDropArea({ children }: PhotoDropAreaProps) {
  return children;
}
