export function getBottomEndPosition({
  anchorRight,
  anchorBottom,
  viewportWidth,
  width,
  collisionInset,
  gap,
}: {
  anchorRight: number;
  anchorBottom: number;
  viewportWidth: number;
  width: number;
  collisionInset: number;
  gap: number;
}) {
  const maxLeft = Math.max(
    collisionInset,
    viewportWidth - width - collisionInset,
  );

  return {
    left: Math.min(
      Math.max(anchorRight - width, collisionInset),
      maxLeft,
    ),
    top: anchorBottom + gap,
  };
}
