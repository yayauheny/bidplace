import { useId } from 'react';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import {
  searchChromeStrokeViewport,
  searchChromeTokens,
  type SearchChromeKind,
} from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';

export function FigmaSearchChromeStroke({
  kind,
  width,
  height,
}: {
  kind: SearchChromeKind;
  width: number;
  height: number;
}) {
  const palette = useAppTheme();
  const instanceId = useId().replace(/:/g, '');
  if (width <= 0 || height <= 0) return null;

  const frame = searchChromeStrokeViewport(kind, width, height, palette);
  const gradientId = `search-chrome-${kind}-${instanceId}`;

  return (
    <Svg
      pointerEvents="none"
      aria-hidden
      width={frame.width}
      height={frame.height}
      style={{ position: 'absolute', left: frame.left, top: frame.top }}
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1={frame.axis.x1}
          y1={frame.axis.y1}
          x2={frame.axis.x2}
          y2={frame.axis.y2}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={frame.axis.start} />
          <Stop offset="1" stopColor={frame.axis.end} />
        </LinearGradient>
      </Defs>
      <Rect
        x={frame.path.x}
        y={frame.path.y}
        width={frame.path.width}
        height={frame.path.height}
        rx={frame.path.rx}
        ry={frame.path.ry}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={searchChromeTokens.strokeWidth}
      />
    </Svg>
  );
}
