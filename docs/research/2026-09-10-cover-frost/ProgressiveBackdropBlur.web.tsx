import React from 'react';
import { coverFrostSpec } from '../../../apps/mobile/src/components/figma/cover-frost-style';
const spec = coverFrostSpec('web');
const fill = { position: 'absolute', inset: 0 } as const;

// Independent experimental algorithm: triangular, overlapping full-size bands.
// Every band samples the backdrop; no image is cloned or rasterized here.
export function ProgressiveBackdropBlurWeb({ steps }: { steps: number }) {
  return (
    <>
      {Array.from({ length: steps }, (_, index) => {
        const peak = (index + 1) / steps;
        const mask = `linear-gradient(to bottom, transparent ${100 * (peak - 1 / steps)}%, black ${100 * peak}%, ${index === steps - 1 ? 'black' : 'transparent'} ${100 * Math.min(1, peak + 1 / steps)}%)`;
        const blur = `blur(${spec.figmaProgressiveBlurRadius * peak}px)`;
        return (
          <div
            key={index}
            style={{
              ...fill,
              backdropFilter: blur,
              WebkitBackdropFilter: blur,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </>
  );
}
