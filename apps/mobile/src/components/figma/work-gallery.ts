export type WorkGalleryImage = {
  id: string;
  url: string;
  position?: number;
};

export function orderedWorkGalleryImages<T extends WorkGalleryImage>(
  images: readonly T[],
): T[] {
  return [...images].sort((left, right) => {
    const leftPosition = left.position ?? 0;
    const rightPosition = right.position ?? 0;
    if (leftPosition !== rightPosition) return leftPosition - rightPosition;
    return 0;
  });
}
