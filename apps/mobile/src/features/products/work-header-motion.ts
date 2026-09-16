import { designTokens } from '@bidplace/design-tokens';
import {
  progressForHeaderState as progressForStickyHeaderState,
  stickyHeaderStateFromScroll,
  type StickyHeaderState,
} from '../../lib/sticky-header-motion';

export const WORK_SCROLL_TEST_ID = 'product-scroll-view';
export const WORK_HEADER_COLLAPSE_SCROLL = 558;
export const WORK_HEADER_EXPAND_SCROLL = 538;
export const WORK_HEADER_TRANSITION_MS = 200;
export const WORK_HEADER_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export type WorkHeaderState = StickyHeaderState;

export function workHeaderStateFromScroll(
  scrollTop: number,
  current: WorkHeaderState,
): WorkHeaderState {
  return stickyHeaderStateFromScroll(scrollTop, current, {
    collapseAt: WORK_HEADER_COLLAPSE_SCROLL,
    expandAt: WORK_HEADER_EXPAND_SCROLL,
  });
}

export function workProgressForHeaderState(state: WorkHeaderState) {
  return progressForStickyHeaderState(state);
}

export function workWebCompactStack() {
  return (
    designTokens.space.x3 +
    designTokens.size.header +
    designTokens.space.x5
  );
}

export function findWorkScrollBoundary(from: Element | null) {
  if (!(from instanceof HTMLElement)) {
    return null;
  }
  const labeled = from.closest(`[data-testid="${WORK_SCROLL_TEST_ID}"]`);
  return labeled instanceof HTMLElement ? labeled : null;
}

export function workHeaderScrollTopFromEvent(
  event: Pick<Event, 'target'>,
  boundary: HTMLElement,
) {
  return event.target === boundary ? boundary.scrollTop : null;
}

export function readWorkScrollTop(boundary: HTMLElement) {
  return boundary.scrollTop;
}
