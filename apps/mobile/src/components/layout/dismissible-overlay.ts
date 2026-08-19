export function isEscapeKey(event: KeyboardEvent): boolean {
  return event.key === 'Escape';
}

export type ContainsLike = {
  contains: (node: Node | null) => boolean;
};

export function isNodeInsideSurfaces(
  target: EventTarget | null,
  surfaces: Array<ContainsLike | null | undefined>,
) {
  if (!target) return false;

  return surfaces.some(
    (surface) =>
      surface?.contains?.(target as unknown as Node | null) === true,
  );
}

export function shouldCloseOnPointerDown(
  target: EventTarget | null,
  surfaces: Array<ContainsLike | null | undefined>,
): boolean {
  return !isNodeInsideSurfaces(target, surfaces);
}

