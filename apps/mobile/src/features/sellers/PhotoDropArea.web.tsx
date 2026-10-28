import type { PhotoDropAreaProps } from './PhotoDropArea';

function insertionAt(grid: HTMLElement, x: number, y: number, initial: number) {
  let to = initial;
  let distance = Infinity;
  for (const tile of grid.querySelectorAll<HTMLElement>('[data-photo-index]')) {
    const box = tile.parentElement!.getBoundingClientRect();
    const candidate = Math.hypot(
      x - box.x - box.width / 2,
      y - box.y - box.height / 2,
    );
    if (candidate < distance) {
      to = Number(tile.dataset.photoIndex);
      distance = candidate;
    }
  }
  return to;
}

export function PhotoDropArea({
  children,
  preview,
  onPreview,
  onMove,
}: PhotoDropAreaProps) {
  return (
    <div
      style={{ width: '100%' }}
      onDragOver={(event) => {
        if (!preview) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const to = insertionAt(
          event.currentTarget,
          event.clientX,
          event.clientY,
          preview.from,
        );
        if (to !== preview.to) onPreview?.({ ...preview, to });
      }}
      onDrop={(event) => {
        if (!preview) return;
        event.preventDefault();
        if (event.dataTransfer.getData('text/plain') === preview.id)
          onMove?.(
            preview.id,
            insertionAt(
              event.currentTarget,
              event.clientX,
              event.clientY,
              preview.from,
            ),
          );
        onPreview?.(null);
      }}
      onDragLeave={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (
          preview &&
          (event.clientX < box.left ||
            event.clientX >= box.right ||
            event.clientY < box.top ||
            event.clientY >= box.bottom)
        )
          onPreview?.({ ...preview, to: preview.from });
      }}
    >
      {children}
    </div>
  );
}
