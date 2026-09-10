export const SHARE_SHEET_FOCUSABLE =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function isTabKey(event: { key: string }) {
  return event.key === 'Tab';
}

export function nextFocusIndex(
  current: number,
  count: number,
  reverse: boolean,
) {
  if (count <= 0) return 0;
  if (reverse) return (current - 1 + count) % count;
  return (current + 1) % count;
}
