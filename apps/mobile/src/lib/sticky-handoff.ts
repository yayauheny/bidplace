import { designTokens } from '@bidplace/design-tokens';

export const STICKY_HANDOFF_HYSTERESIS = 20;
export const WEB_COMPACT_STACK =
  designTokens.space.x3 +
  designTokens.size.header +
  designTokens.space.x5;

export type StickyHeaderState = 'expanded' | 'compact';

export function stickyHandoffThresholds(
  heroHeight: number,
  compactStack = WEB_COMPACT_STACK,
) {
  const collapseAt = Math.max(0, heroHeight - compactStack);
  return {
    collapseAt,
    expandAt: Math.max(0, collapseAt - STICKY_HANDOFF_HYSTERESIS),
    compactStack,
  };
}

export function workHandoffThresholds(heroHeight: number) {
  return stickyHandoffThresholds(heroHeight, 0);
}

export function stickyHeaderStateFromScroll(
  scrollTop: number,
  current: StickyHeaderState,
  thresholds: { collapseAt: number; expandAt: number },
): StickyHeaderState {
  if (thresholds.collapseAt <= 0) {
    return 'expanded';
  }
  if (scrollTop >= thresholds.collapseAt) {
    return 'compact';
  }
  if (scrollTop <= thresholds.expandAt) {
    return 'expanded';
  }
  return current;
}

export function findScrollBoundary(from: Element | null, testId: string) {
  if (!(from instanceof HTMLElement)) {
    return null;
  }
  const labeled = from.closest(`[data-testid="${testId}"]`);
  return labeled instanceof HTMLElement ? labeled : null;
}

function isVerticalScrollTarget(
  target: EventTarget | null,
  boundary: HTMLElement,
) {
  if (!(target instanceof HTMLElement) || !boundary.contains(target)) {
    return false;
  }
  return target === boundary || target.scrollHeight > target.clientHeight + 1;
}

export function scrollTopFromEvent(event: Event, boundary: HTMLElement) {
  return isVerticalScrollTarget(event.target, boundary)
    ? (event.target as HTMLElement).scrollTop
    : readCurrentScrollTop(boundary);
}

export function readCurrentScrollTop(boundary: HTMLElement) {
  if (boundary.scrollHeight > boundary.clientHeight + 1) {
    return boundary.scrollTop;
  }
  const nodes = boundary.querySelectorAll<HTMLElement>('*');
  for (const node of nodes) {
    if (node.scrollHeight > node.clientHeight + 1) {
      return node.scrollTop;
    }
  }
  return boundary.scrollTop;
}
