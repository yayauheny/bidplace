import type { CSSProperties } from 'react';

import {
  figmaChipGradientStroke,
  figmaChipSizeStyle,
  figmaChipStyle,
  figmaChipTextColor,
  figmaChipTypography,
  figmaChipUsesGradientStroke,
  type FigmaChipSize,
  type FigmaChipTone,
} from './figma-chip-style';

type MaskedStrokeStyle = CSSProperties & {
  WebkitMask?: string;
  WebkitMaskComposite?: string;
};

export function FigmaChip({
  label,
  tone = 'onLight',
  size = 'compact',
}: {
  label: string;
  tone?: FigmaChipTone;
  size?: FigmaChipSize;
}) {
  const usesGradientStroke = figmaChipUsesGradientStroke(tone);
  const baseStyle = figmaChipStyle(tone);
  const sizeStyle = figmaChipSizeStyle(size);
  const paddingHorizontal =
    'paddingHorizontal' in sizeStyle
      ? sizeStyle.paddingHorizontal
      : baseStyle.paddingHorizontal;
  const paddingVertical =
    'paddingVertical' in sizeStyle
      ? sizeStyle.paddingVertical
      : baseStyle.paddingVertical;
  const typography = figmaChipTypography(size);

  return (
    <div
      style={{
        borderRadius: baseStyle.borderRadius,
        backgroundColor: baseStyle.backgroundColor,
        borderWidth: baseStyle.borderWidth,
        borderStyle: 'solid',
        borderColor: usesGradientStroke
          ? 'transparent'
          : baseStyle.borderColor,
        alignItems: baseStyle.alignItems,
        justifyContent: baseStyle.justifyContent,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        paddingTop: paddingVertical,
        paddingBottom: paddingVertical,
        position: 'relative',
        display: 'flex',
        boxSizing: 'border-box',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      {usesGradientStroke ? (
        <div
          aria-hidden="true"
          style={gradientStrokeStyle}
        />
      ) : null}
      <span
        style={{
          color: figmaChipTextColor(tone, size),
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          fontWeight: typography.fontWeight,
          lineHeight: `${typography.lineHeight}px`,
          letterSpacing: typography.letterSpacing,
          display: 'block',
          minWidth: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

const gradientStrokeStyle: MaskedStrokeStyle = {
  position: 'absolute',
  inset: 0,
  padding: 1,
  borderRadius: 'inherit',
  pointerEvents: 'none',
  boxSizing: 'border-box',
  backgroundImage: `linear-gradient(180deg, ${figmaChipGradientStroke.start}, ${figmaChipGradientStroke.end})`,
  WebkitMask:
    'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  maskComposite: 'exclude',
};
