import {
  figmaButtonMatrixCell,
  figmaButtonTokens,
  figmaButtonVariants,
  resolveFigmaButtonInteraction,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
} from '@bidplace/design-tokens';

export {
  figmaButtonVariants,
  resolveFigmaButtonInteraction,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
};

export function figmaButtonStyle(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  const cell = figmaButtonMatrixCell(variant, interaction);
  const { metrics } = figmaButtonTokens;

  return {
    // Inside stroke sits in the frame, so the sample «Кнопка» box is 83×43.
    paddingHorizontal: metrics.paddingX + metrics.strokeWidth,
    paddingVertical: metrics.paddingY + metrics.strokeWidth,
    borderRadius: cell.borderRadius,
    backgroundColor: 'transparent',
    opacity: cell.controlOpacity,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };
}

export function figmaButtonOverlayColor(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).overlay;
}

export function figmaButtonLabelColor(variant: FigmaButtonVariant) {
  return figmaButtonMatrixCell(variant, 'idle').labelColor;
}

export function figmaButtonSurfaceFill(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).fill;
}

export function figmaButtonPressedGhostInset(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).pressedGhostInset;
}

export function figmaButtonStrokeMode(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).strokeMode;
}

export function figmaButtonGradientAxis(variant: 'solid' | 'outline') {
  const axis = figmaButtonTokens.gradientStroke[variant];
  return {
    x1: axis.x1,
    y1: axis.y1,
    x2: axis.x2,
    y2: axis.y2,
    start: axis.start,
    end: axis.end,
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
) {
  const axis = figmaButtonGradientAxis(variant);
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
) {
  return figmaButtonMatrixCell(variant, interaction).strokeColor;
}
