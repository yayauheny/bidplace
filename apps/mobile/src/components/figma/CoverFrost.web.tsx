import { figmaTokens } from '@bidplace/design-tokens';

import {
  coverFrostLevels,
  coverFrostMask,
  coverFrostSpec,
  type CoverFrostPlacement,
} from './cover-frost-style';

export function CoverFrost({
  placement,
}: {
  imageUrl: string;
  placement: CoverFrostPlacement;
}) {
  const spec = coverFrostSpec(placement);
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
      {coverFrostLevels.map((level, index) => {
        const blur = `blur(${((spec.runtimeBlur * level) / figmaTokens.size.coverWidth) * 100}cqw)`;
        const mask = coverFrostMask(index, spec.top);
        return (
          <div
            key={level}
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: blur,
              WebkitBackdropFilter: blur,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
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
