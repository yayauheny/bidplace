export type StickyHeaderState = 'expanded' | 'compact';

export function stickyHeaderStateFromScroll(
  scrollTop: number,
  current: StickyHeaderState,
  thresholds: { collapseAt: number; expandAt: number },
): StickyHeaderState {
  if (scrollTop >= thresholds.collapseAt) {
    return 'compact';
  }
  if (scrollTop <= thresholds.expandAt) {
    return 'expanded';
  }
  return current;
}

export function progressForHeaderState(state: StickyHeaderState) {
  return state === 'compact' ? 1 : 0;
}
