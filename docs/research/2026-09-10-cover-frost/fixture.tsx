import { ProgressiveBackdropBlurWeb } from './ProgressiveBackdropBlur.web';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { figmaTokens } from '@bidplace/design-tokens';
import { LinearBlur } from 'progressive-blur';
import { coverFrostSpec } from '../../../apps/mobile/src/components/figma/cover-frost-style';

const spec = coverFrostSpec('web');
const fill = { position: 'absolute', inset: 0 } as const;
const params = new URLSearchParams(location.search);
const variant = params.get('variant') || 'A';
const count = Number(params.get('count') || 1);
const image = params.get('image') || 'color';

function Card({ index }: { index: number }) {
  const [expanded, expand] = React.useState(false);
  const [source, changeSource] = React.useState(image);
  return (
    <article
      className="card"
      style={{ borderRadius: figmaTokens.radius.cover }}
    >
      <img src={`/${source}.svg`} alt={`Artwork ${index + 1}`} />
      <div className="overlay">
        <div
          className="frost"
          aria-hidden="true"
          style={{
            ...fill,
            pointerEvents: 'none',
            overflow: 'hidden',
            borderRadius: `${spec.topRadius}px ${spec.topRadius}px 0 0`,
            ...(variant === 'A'
              ? {
                  backdropFilter: `blur(${spec.runtimeBlur}px)`,
                  WebkitBackdropFilter: `blur(${spec.runtimeBlur}px)`,
                }
              : {}),
          }}
        >
          {variant.startsWith('B') && (
            <ProgressiveBackdropBlurWeb steps={Number(variant.slice(1))} />
          )}
          {variant.startsWith('C') && (
            <LinearBlur
              steps={Number(variant.slice(1))}
              strength={spec.figmaProgressiveBlurRadius}
              side="bottom"
              falloffPercentage={100}
              tint="transparent"
              aria-hidden="true"
              style={{ ...fill, pointerEvents: 'none' }}
            />
          )}
          {variant === 'M' && (
            <div
              style={{
                ...fill,
                backdropFilter: 'blur(60px)',
                WebkitBackdropFilter: 'blur(60px)',
                maskImage: 'linear-gradient(transparent, black)',
                WebkitMaskImage: 'linear-gradient(transparent, black)',
              }}
            />
          )}
          <div
            className="tint"
            style={{
              ...fill,
              backgroundImage: `linear-gradient(to bottom, ${spec.gradientStart}, ${spec.gradientEnd})`,
            }}
          />
        </div>
        <div
          className="content"
          style={{ padding: spec.contentPadding, gap: spec.contentGap }}
        >
          <a
            href="#artwork"
            style={{
              fontSize: figmaTokens.typography.coverTitle.fontSize,
              lineHeight: `${figmaTokens.typography.coverTitle.lineHeight}px`,
            }}
          >
            Работа с живым фоном
            {expanded ? (
              <>
                <br />
                Длинное название работы
                <br />
                Дополнительная строка
              </>
            ) : null}
          </a>
          <span>@test-author</span>
        </div>
      </div>
      <button className="expand" onClick={() => expand(!expanded)}>
        Height
      </button>
      <button
        className="swap"
        onClick={() =>
          changeSource(source === 'contrast' ? 'color' : 'contrast')
        }
      >
        Image
      </button>
    </article>
  );
}
createRoot(document.getElementById('root')!).render(
  <>
    {Array.from({ length: count }, (_, index) => (
      <Card key={index} index={index} />
    ))}
  </>,
);
