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
    backgroundColor: cell.pressedGhostInset ? 'transparent' : cell.fill,
    opacity: cell.controlOpacity,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
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

export function figmaButtonStrokeMode(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).strokeMode;
}

export function figmaButtonPressedGhostInset(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).pressedGhostInset;
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

export function figmaButtonFlatStrokeColor(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
) {
  return figmaButtonMatrixCell(variant, interaction).strokeColor;
}
