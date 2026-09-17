import { Circle, G, Path, Svg } from 'react-native-svg';

import {
  bidplaceLogoMark,
  type BidplaceLogoMotion,
} from './bidplace-logo-mark';

/** Native/Metro fallback: motion is web-only. */
export function AnimatedBidplaceLogo({
  size = 168,
  onLoadingCycleEnd,
}: {
  motion?: BidplaceLogoMotion;
  size?: number;
  onLoadingCycleEnd?: () => boolean | void;
}) {
  void onLoadingCycleEnd;
  const height =
    (size * bidplaceLogoMark.viewBox.height) / bidplaceLogoMark.viewBox.width;
  const pupils = bidplaceLogoMark.pupils.default;

  return (
    <Svg
      width={size}
      height={height}
      viewBox={`0 0 ${bidplaceLogoMark.viewBox.width} ${bidplaceLogoMark.viewBox.height}`}
      accessibilityRole="image"
      accessibilityLabel="Bidplace"
    >
      <G>
        <Path d={bidplaceLogoMark.bodyPath} fill="#000000" />
      </G>
      <G>
        <Circle
          cx={bidplaceLogoMark.eyes.left.cx}
          cy={bidplaceLogoMark.eyes.left.cy}
          r={bidplaceLogoMark.eyes.left.r}
          fill="#FFFFFF"
        />
        <Circle
          cx={bidplaceLogoMark.eyes.right.cx}
          cy={bidplaceLogoMark.eyes.right.cy}
          r={bidplaceLogoMark.eyes.right.r}
          fill="#FFFFFF"
        />
      </G>
      <G>
        <Circle
          cx={pupils.left.cx}
          cy={pupils.left.cy}
          r={pupils.left.r}
          fill="#000000"
        />
        <Circle
          cx={pupils.right.cx}
          cy={pupils.right.cy}
          r={pupils.right.r}
          fill="#000000"
        />
      </G>
    </Svg>
  );
}
