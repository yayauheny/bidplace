import { creatorWebCompactChrome } from '../../src/features/sellers/creator-header-motion';

export type CreatorMotionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function creatorMotionRect(node: Element | null): CreatorMotionRect | null {
  if (!node) {
    return null;
  }
  const rect = node.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

export function classifyDockVisibility(
  rect: Pick<CreatorMotionRect, 'y' | 'height'> | null,
  dockHeight = creatorWebCompactChrome(),
): 'outside' | 'partial' | 'inside' {
  if (!rect) {
    return 'outside';
  }
  const top = rect.y;
  const bottom = rect.y + rect.height;
  if (bottom <= 0 || top >= dockHeight) {
    return 'outside';
  }
  if (top >= 0 && bottom <= dockHeight) {
    return 'inside';
  }
  return 'partial';
}

export function parseClipInsets(clipPath: string | null | undefined) {
  const values = [...(clipPath ?? '').matchAll(/(-?[\d.]+)px/g)].map((match) =>
    Number(match[1]),
  );
  if (values.length === 0) {
    return { top: null, bottom: null };
  }
  if (values.length === 1) {
    return { top: values[0], bottom: values[0] };
  }
  if (values.length === 3) {
    return { top: values[0], bottom: values[2] };
  }
  return { top: values[0], bottom: values[2] ?? 0 };
}

export function visibleLayerFromClip(input: {
  layerTop: number;
  layerHeight: number;
  clipTop: number;
  clipBottom: number;
}) {
  return {
    top: input.layerTop + input.clipTop,
    height: input.layerHeight - input.clipTop - input.clipBottom,
  };
}

export function visibleDockFromSticky(input: {
  stickyTop: number;
  stickyHeight: number;
  clipTop: number;
  clipBottom: number;
}) {
  return visibleLayerFromClip({
    layerTop: input.stickyTop,
    layerHeight: input.stickyHeight,
    clipTop: input.clipTop,
    clipBottom: input.clipBottom,
  });
}

export function clippedVisibleHeight(input: {
  top: number;
  height: number;
  clips: Array<{
    top: number;
    height: number;
    clipTop: number;
    clipBottom: number;
  }>;
}) {
  let top = input.top;
  let bottom = input.top + input.height;
  for (const clip of input.clips) {
    top = Math.max(top, clip.top + clip.clipTop);
    bottom = Math.min(bottom, clip.top + clip.height - clip.clipBottom);
  }
  return Math.max(0, bottom - top);
}
