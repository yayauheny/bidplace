import { useId } from 'react';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import {
  searchChromeScaledPaint,
  searchChromeTokens,
  type SearchChromeKind,
} from '@bidplace/design-tokens';

export function FigmaSearchChromeStroke({
  kind,
  width,
  height,
}: {
  kind: SearchChromeKind;
  width: number;
  height: number;
}) {
  const instanceId = useId().replace(/:/g, '');
  if (width <= 0 || height <= 0) return null;

  const paint = searchChromeScaledPaint(kind, width, height);
  const strokeWidth = searchChromeTokens.strokeWidth;
  const left = Math.min(0, paint.x);
  const top = Math.min(0, paint.y);
  const svgWidth = Math.max(width, paint.x + paint.width) - left;
  const svgHeight = Math.max(height, paint.y + paint.height) - top;
  const gradientId = `search-chrome-${kind}-${instanceId}`;

  return (
    <Svg
      pointerEvents="none"
      aria-hidden
      width={svgWidth}
      height={svgHeight}
      style={{ position: 'absolute', left, top }}
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1={paint.axis.x1 - left}
          y1={paint.axis.y1 - top}
          x2={paint.axis.x2 - left}
          y2={paint.axis.y2 - top}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={paint.axis.start} />
          <Stop offset="1" stopColor={paint.axis.end} />
        </LinearGradient>
      </Defs>
      <Rect
        x={paint.x - left}
        y={paint.y - top}
        width={paint.width}
        height={paint.height}
        rx={paint.rx}
        ry={paint.ry}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
