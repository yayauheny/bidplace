import { Rect, Svg } from 'react-native-svg';

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
  if (width <= 0 || height <= 0) return null;

  const frame = searchChromeStrokeViewport(kind, width, height, palette);

  return (
    <Svg
      pointerEvents="none"
      aria-hidden
      width={frame.width}
      height={frame.height}
      style={{ position: 'absolute', left: frame.left, top: frame.top }}
    >
      <Rect
        x={frame.path.x}
        y={frame.path.y}
        width={frame.path.width}
        height={frame.path.height}
        rx={frame.path.rx}
        ry={frame.path.ry}
        fill="none"
        stroke={palette.toolbarBorder}
        strokeWidth={searchChromeTokens.strokeWidth}
      />
    </Svg>
  );
}
