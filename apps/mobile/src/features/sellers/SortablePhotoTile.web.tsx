import type { SortablePhotoTileProps } from './sortable-photo-tile';
export function SortablePhotoTile({
  id,
  index,
  count,
  columns,
  disabled,
  onMove,
  children,
}: SortablePhotoTileProps) {
  return (
    <div
      style={{ width: '100%' }}
      draggable={!disabled}
      tabIndex={0}
      role="listitem"
      aria-label={`Фото ${index + 1} из ${count}. Alt и стрелки меняют порядок.`}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', id)}
      onDragOver={(event) => {
        if (!disabled) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const source = event.dataTransfer.getData('text/plain');
        if (!disabled && source) onMove(source, index);
      }}
      onKeyDown={(event) => {
        if (!event.altKey || disabled) return;
        const direction = {
          ArrowLeft: -1,
          ArrowRight: 1,
          ArrowUp: -columns,
          ArrowDown: columns,
        }[event.key];
        if (direction !== undefined) {
          event.preventDefault();
          onMove(id, Math.max(0, Math.min(count - 1, index + direction)));
        }
      }}
    >
      {children}
    </div>
  );
}
