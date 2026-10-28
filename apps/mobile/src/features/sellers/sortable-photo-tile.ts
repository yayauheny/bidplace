import type { ReactNode } from 'react';
export type SortablePhotoTileProps = {
  id: string;
  index: number;
  count: number;
  columns: number;
  disabled: boolean;
  preview?: PhotoDragPreview | null;
  onPreview?: (preview: PhotoDragPreview | null) => void;
  onMove: (id: string, index: number) => void;
  children: ReactNode;
};
export function photoDropIndex(
  index: number,
  count: number,
  columns: number,
  width: number,
  x: number,
  y: number,
) {
  'worklet';
  return Math.max(
    0,
    Math.min(
      count - 1,
      index +
        Math.round(x / (width + 12)) +
        columns * Math.round(y / ((width * 4) / 3 + 12)),
    ),
  );
}

export type PhotoDragPreview = { id: string; from: number; to: number };

export function photoPreviewIndex(
  index: number,
  preview?: PhotoDragPreview | null,
) {
  if (!preview) return index;
  if (index === preview.from) return preview.to;
  if (preview.from < index && index <= preview.to) return index - 1;
  if (preview.to <= index && index < preview.from) return index + 1;
  return index;
}
