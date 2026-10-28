// A deliberate downward pull; horizontal movement and small taps stay local.
export function shouldDismissSheet(dx: number, dy: number, velocityY: number) {
  return dy > Math.abs(dx) && (dy >= 80 || (dy >= 24 && velocityY >= 0.6));
}
