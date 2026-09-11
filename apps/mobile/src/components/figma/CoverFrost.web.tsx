import type { CSSProperties } from 'react';

import {
  coverFrostBlur,
  coverFrostBlurMask,
  coverFrostSpec,
  type CoverFrostPlacement,
} from './cover-frost-style';

type FrostLayerStyle = CSSProperties & {
  WebkitBackdropFilter?: string;
  WebkitMaskImage?: string;
  WebkitMaskRepeat?: string;
  WebkitMaskSize?: string;
};

export function CoverFrost({
  placement,
}: {
  imageUrl: string;
  placement: CoverFrostPlacement;
}) {
  const spec = coverFrostSpec(placement);
  const blur = coverFrostBlur(spec.runtimeBlur);
  const mask = coverFrostBlurMask(spec.top);

  return (
    <div
      data-testid="figma-cover-frost"
      data-placement={placement}
      aria-hidden="true"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: 0,
        right: 0,
        [spec.top ? 'top' : 'bottom']: 0,
        height: `${spec.heightPercent}%`,
      }}
    >
      <div
        style={
          {
            position: 'absolute',
            inset: 0,
            backdropFilter: blur,
            WebkitBackdropFilter: blur,
            maskImage: mask,
            WebkitMaskImage: mask,
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
          } satisfies FrostLayerStyle
        }
      />
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
