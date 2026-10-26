import type { ReactNode } from 'react';
export type SortablePhotoTileProps = {
  id: string;
  index: number;
  count: number;
  columns: number;
  disabled: boolean;
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
