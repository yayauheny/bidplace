export const OVERLAY_FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type FocusableLike = {
  tabIndex: number;
  offsetParent: unknown;
  focus: (options?: { preventScroll?: boolean }) => void;
};

export function isDisplayedFocusable(node: FocusableLike): boolean {
  return node.tabIndex !== -1 && node.offsetParent !== null;
}

export function cycleOverlayTabFocus({
  shiftKey,
  active,
  nodes,
}: {
  shiftKey: boolean;
  active: unknown;
  nodes: FocusableLike[];
}): FocusableLike | null {
  if (nodes.length === 0) return null;
  const start = nodes[0];
  const end = nodes[nodes.length - 1];
  if (shiftKey && active === start) return end;
  if (!shiftKey && active === end) return start;
  return null;
}
