/**
 * Search overlay chrome from Figma `456:8298` (captured 2026-10-10).
 * Scoped to that popup. It does not replace dock, filter, or text-button strokes.
 * Axes are the local userSpaceOnUse vectors in fallbacks/001-456_8298.svg.
 */
export const searchChromeTokens = {
  figmaNode: '456:8298',
  capturedAt: '2026-10-10T20:13:31.946Z',
  fill: 'rgba(255, 255, 255, 0.6)',
  blur: {
    figmaRadius: 12,
    cssPx: 6,
  },
  strokeWidth: 0.5,
  gradient: {
    start: '#D1D1D1',
    end: '#EBEBEB',
  },
  field: {
    node: '456:8369',
    sampleWidth: 302,
    sampleHeight: 52,
    radius: 200,
    iconFrame: 36,
    padding: 8,
    gap: 8,
    stroke: { x: -0.25, y: -0.25, width: 302.5, height: 52.5 },
    axis: { x1: 0, y1: 0, x2: 225.915, y2: 159.659 },
    typography: {
      fontFamily: 'Inter_400Regular',
      fontSize: 16,
      lineHeight: 19,
      letterSpacing: -0.16,
      fontWeight: '400' as const,
      color: '#121212',
    },
  },
  close: {
    node: '456:8375',
    sampleWidth: 52,
    sampleHeight: 52,
    radius: 200,
    stroke: { x: -0.25, y: -0.25, width: 52.5, height: 52.5 },
    axis: { x1: 0, y1: 0, x2: 57.477, y2: 6.9942 },
  },
  rail: {
    node: '4306:9061',
    sampleWidth: 364,
    sampleHeight: 50,
    radius: 31,
    padding: 4.5,
    gap: 4,
    stroke: { x: 0.25, y: 0.25, width: 363.5, height: 49.5 },
    axis: { x1: 0, y1: 0, x2: 228.763, y2: 202.658 },
  },
  tab: {
    height: 41,
    radius: 80,
    fill: '#FFFFFF',
    selectedFill: '#F3F3F3',
    stroke: '#FFFFFF',
    label: '#565656',
    typography: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: -0.28,
      fontWeight: '500' as const,
    },
  },
  rowGap: 12,
  /** Field bottom (20+52) to the tab capsule at y=82. */
  railOffset: 10,
} as const;

export type SearchChromeKind = 'field' | 'close' | 'rail';

export function searchChromeShape(kind: SearchChromeKind) {
  return searchChromeTokens[kind];
}

/**
 * SVG frame that contains the whole stroke, including the outer half of
 * `strokeWidth`. The path and gradient axis are shifted into that frame.
 */
export function searchChromeStrokeViewport(
  kind: SearchChromeKind,
  width: number,
  height: number,
) {
  const paint = searchChromeScaledPaint(kind, width, height);
  const half = searchChromeTokens.strokeWidth / 2;
  const left = Math.min(0, paint.x - half);
  const top = Math.min(0, paint.y - half);
  const right = Math.max(width, paint.x + paint.width + half);
  const bottom = Math.max(height, paint.y + paint.height + half);
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
    path: {
      x: paint.x - left,
      y: paint.y - top,
      width: paint.width,
      height: paint.height,
      rx: paint.rx,
      ry: paint.ry,
    },
    axis: {
      x1: paint.axis.x1 - left,
      y1: paint.axis.y1 - top,
      x2: paint.axis.x2 - left,
      y2: paint.axis.y2 - top,
      start: paint.axis.start,
      end: paint.axis.end,
    },
  };
}

/** Scale the sample SVG stroke path and gradient axis onto the measured box. */
export function searchChromeScaledPaint(
  kind: SearchChromeKind,
  width: number,
  height: number,
) {
  const shape = searchChromeShape(kind);
  const scaleX = width / shape.sampleWidth;
  const scaleY = height / shape.sampleHeight;
  const path = {
    x: shape.stroke.x * scaleX,
    y: shape.stroke.y * scaleY,
    width: shape.stroke.width * scaleX,
    height: shape.stroke.height * scaleY,
  };
  const radius = Math.min(shape.radius, path.width / 2, path.height / 2);
  return {
    ...path,
    rx: radius,
    ry: radius,
    axis: {
      x1: shape.axis.x1 * scaleX,
      y1: shape.axis.y1 * scaleY,
      x2: shape.axis.x2 * scaleX,
      y2: shape.axis.y2 * scaleY,
      start: searchChromeTokens.gradient.start,
      end: searchChromeTokens.gradient.end,
    },
  };
}
