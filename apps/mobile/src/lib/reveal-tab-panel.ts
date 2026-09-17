import { findScrollBoundary } from './sticky-handoff';

function findVerticalScrollOwner(
  from: Element | null,
  testId: string,
): HTMLElement | null {
  const boundary = findScrollBoundary(from, testId);
  if (!boundary) {
    return null;
  }
  if (boundary.scrollHeight > boundary.clientHeight + 1) {
    return boundary;
  }
  const nodes = boundary.querySelectorAll<HTMLElement>('*');
  for (const node of nodes) {
    if (node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
  }
  return boundary;
}

function tabPanelRevealDelta(panelTop: number, desiredTop: number) {
  const delta = panelTop - desiredTop;
  return delta < 0 ? delta : 0;
}

export function revealTabPanelStartIfAbove(input: {
  from: Element | null;
  scrollTestId: string;
  panel: Element | null;
  desiredTop: number;
}) {
  if (!(input.panel instanceof HTMLElement)) {
    return;
  }
  const owner = findVerticalScrollOwner(input.from, input.scrollTestId);
  if (!owner) {
    return;
  }
  const delta = tabPanelRevealDelta(
    input.panel.getBoundingClientRect().top,
    input.desiredTop,
  );
  if (delta === 0) {
    return;
  }
  owner.scrollTop += delta;
  owner.dispatchEvent(new Event('scroll', { bubbles: false }));
}
