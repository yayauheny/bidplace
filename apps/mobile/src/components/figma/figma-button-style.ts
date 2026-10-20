import {
  figmaButtonMatrixCell,
  figmaButtonSizeMetrics,
  figmaButtonTokens,
  figmaButtonVariants,
  resolveFigmaButtonInteraction,
  type FigmaButtonInteraction,
  type FigmaButtonSize,
  type FigmaButtonVariant,
  type SemanticColorMap,
} from '@bidplace/design-tokens';

export {
  figmaButtonVariants,
  resolveFigmaButtonInteraction,
  type FigmaButtonInteraction,
  type FigmaButtonSize,
  type FigmaButtonVariant,
};

export function figmaButtonStyle(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  size: FigmaButtonSize = 'matrix',
  palette: SemanticColorMap,
) {
  const cell = figmaButtonMatrixCell(variant, interaction, palette);
  const sizeMetrics = figmaButtonSizeMetrics(size);
  const { strokeWidth } = figmaButtonTokens.metrics;

  return {
    // Inside stroke sits in the frame. Matrix sample «Кнопка» is 83×43.
    paddingHorizontal: sizeMetrics.paddingX + strokeWidth,
    ...(size === 'navigation' ? { paddingRight: 10.5 } : {}),
    paddingVertical: sizeMetrics.paddingY + strokeWidth,
    borderRadius: cell.borderRadius,
    backgroundColor: 'transparent',
    opacity: cell.controlOpacity,
    justifyContent: 'center' as const,
    alignItems: (size === 'navigation' ? 'stretch' : 'center') as
      | 'center'
      | 'stretch',
  };
}

export function figmaButtonOverlayColor(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  palette: SemanticColorMap,
) {
  return figmaButtonMatrixCell(variant, interaction, palette).overlay;
}

export function figmaButtonLabelColor(
  variant: FigmaButtonVariant,
  size: FigmaButtonSize = 'matrix',
  palette: SemanticColorMap,
) {
  if (size === 'navigation' && variant === 'muted') {
    return palette.inkStrong;
  }
  return figmaButtonMatrixCell(variant, 'idle', palette).labelColor;
}

export function figmaButtonSurfaceFill(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  palette: SemanticColorMap,
) {
  return figmaButtonMatrixCell(variant, interaction, palette).fill;
}

export function figmaButtonPressedGhostInset(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  palette: SemanticColorMap,
) {
  return figmaButtonMatrixCell(variant, interaction, palette).pressedGhostInset;
}

export function figmaButtonStrokeMode(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  palette: SemanticColorMap,
) {
  return figmaButtonMatrixCell(variant, interaction, palette).strokeMode;
}

export function figmaButtonGradientAxis(
  variant: 'solid' | 'outline',
  palette: SemanticColorMap,
) {
  const axis = figmaButtonTokens.gradientStroke[variant];
  return {
    x1: axis.x1,
    y1: axis.y1,
    x2: axis.x2,
    y2: axis.y2,
    start:
      variant === 'solid'
        ? palette.solidBorderGradientStart
        : palette.outlineBorderGradientStart,
    end:
      variant === 'solid'
        ? palette.solidBorderGradientEnd
        : palette.outlineBorderGradientEnd,
  };
}

/** One radius for both SVG axes. Independent rx/ry clamps turn the 0.5 stroke into an ellipse. */
export function figmaButtonStrokeRadius({
  borderRadius,
  width,
  height,
  strokeWidth,
}: {
  borderRadius: number;
  width: number;
  height: number;
  strokeWidth: number;
}) {
  const innerWidth = width - strokeWidth;
  const innerHeight = height - strokeWidth;
  if (innerWidth <= 0 || innerHeight <= 0) return 0;
  return Math.min(borderRadius, innerWidth / 2, innerHeight / 2);
}

/** Sample axes are the 83×43 frame. Scale them onto the measured button. */
export function figmaButtonScaledGradientAxis(
  variant: 'solid' | 'outline',
  width: number,
  height: number,
  palette: SemanticColorMap,
) {
  const axis = figmaButtonGradientAxis(variant, palette);
  const { sampleWidth, sampleHeight } = figmaButtonTokens.metrics;
  const scaleX = width / sampleWidth;
  const scaleY = height / sampleHeight;
  return {
    x1: axis.x1 * scaleX,
    y1: axis.y1 * scaleY,
    x2: axis.x2 * scaleX,
    y2: axis.y2 * scaleY,
    start: axis.start,
    end: axis.end,
  };
}

export function figmaButtonFlatStrokeColor(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
  palette: SemanticColorMap,
) {
  return figmaButtonMatrixCell(variant, interaction, palette).strokeColor;
}
