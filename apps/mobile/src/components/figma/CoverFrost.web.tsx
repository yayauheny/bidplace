import type { CSSProperties, RefObject } from 'react';
import type { View } from 'react-native';

import { useAppTheme } from '../../providers/theme-provider';
import {
  coverFrostMask,
  coverFrostBackdropFilter,
  coverFrostSpec,
  type CoverFrostPlacement,
} from './cover-frost-style';

type FrostLayerStyle = CSSProperties & {
  WebkitBackdropFilter?: string;
  WebkitMaskImage?: string;
};

export function CoverFrost({
  placement,
}: {
  placement: CoverFrostPlacement;
  blurTarget?: RefObject<View | null>;
}) {
  const palette = useAppTheme();
  const spec = coverFrostSpec(placement, palette);

  return (
    <div
      data-testid="figma-cover-frost"
      data-placement={placement}
      aria-hidden="true"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        inset: 0,
      }}
    >
      {!spec.top ? (
        <div
          style={
            {
              position: 'absolute',
              inset: 0,
              backdropFilter: coverFrostBackdropFilter,
              WebkitBackdropFilter: coverFrostBackdropFilter,
              maskImage: coverFrostMask,
              WebkitMaskImage: coverFrostMask,
            } satisfies FrostLayerStyle
          }
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to ${spec.top ? 'top' : 'bottom'}, ${spec.gradientStart}, ${spec.gradientEnd})`,
        }}
      />
    </div>
  );
}
