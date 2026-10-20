import { designTokens } from './tokens';

/**
 * Text-button geometry and 16-cell visual matrix from Figma `292:5058`.
 * Button-only colors; does not replace shared field/chip/quietFill tokens.
 */
export const figmaButtonVariants = [
  'solid',
  'outline',
  'ghost',
  'muted',
] as const;
export const figmaButtonSizes = [
  'matrix',
  'auth',
  'suggestion',
  'navigation',
  'exitConfirm',
  'event',
  'pickerAction',
] as const;
export type FigmaButtonVariant = (typeof figmaButtonVariants)[number];

export const figmaButtonInteractions = [
  'idle',
  'hover',
  'pressed',
  'disabled',
] as const;
export type FigmaButtonInteraction = (typeof figmaButtonInteractions)[number];
export type FigmaButtonSize = (typeof figmaButtonSizes)[number];

export const figmaButtonTokens = {
  figmaNode: '292:5058',
  metrics: {
    paddingX: 16,
    paddingY: 8,
    radius: 80,
    disabledSolidRadius: 40,
    strokeWidth: 0.5,
    sampleLabel: 'Кнопка',
    sampleWidth: 83,
    sampleHeight: 43,
    pressedGhostWidth: 82,
    pressedGhostHeight: 42,
    minTouchTarget: 44,
  },
  typography: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 26,
    letterSpacing: -0.28,
    fontWeight: '600' as const,
  },
  colors: {
    labelOnSolid: '#FFFFFF',
    labelDefault: '#121212',
    solidIdle: '#121212',
    solidDisabledFill: '#949494',
    canvas: '#FFFFFF',
    mutedFill: '#F3F3F3',
    flatStroke: '#F3F3F3',
    ghostStroke: '#FFFFFF',
    gradientSolidStart: '#2A2A2A',
    gradientSolidEnd: '#585858',
    gradientOutlineStart: '#D1D1D1',
    gradientOutlineEnd: '#EBEBEB',
  },
  overlay: {
    solidActive: 'rgba(255, 255, 255, 0.15)',
    outlineGhostActive: 'rgba(0, 0, 0, 0.05)',
    mutedActive: 'rgba(0, 0, 0, 0.06)',
  },
  gradientStroke: {
    solid: {
      x1: 0,
      y1: 0,
      x2: 84.791,
      y2: 39.1182,
      start: '#2A2A2A',
      end: '#585858',
    },
    outline: {
      x1: 0,
      y1: 0,
      x2: 88.232,
      y2: 20.724,
      start: '#D1D1D1',
      end: '#EBEBEB',
    },
  },
  disabledOpacity: 0.5,
} as const;

export type FigmaButtonMatrixCell = {
  fill: string;
  overlay: string | null;
  labelColor: string;
  borderRadius: number;
  strokeMode: 'gradient' | 'flat' | 'ghost' | 'none';
  strokeColor: string | null;
  controlOpacity: number;
  /** Pressed ghost paints 82×42 from the same origin as the 83×43 frame. Node `292:5046`. */
  pressedGhostInset: boolean;
};

export function resolveFigmaButtonInteraction({
  inactive,
  hovered,
  pressed,
}: {
  inactive: boolean;
  hovered: boolean;
  pressed: boolean;
}): FigmaButtonInteraction {
  if (inactive) return 'disabled';
  if (pressed) return 'pressed';
  if (hovered) return 'hover';
  return 'idle';
}

function baseFill(variant: FigmaButtonVariant): string {
  const { colors } = figmaButtonTokens;
  switch (variant) {
    case 'solid':
      return colors.solidIdle;
    case 'outline':
    case 'ghost':
      return colors.canvas;
    case 'muted':
      return colors.mutedFill;
  }
}

function strokeModeFor(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
): FigmaButtonMatrixCell['strokeMode'] {
  if (variant === 'ghost' && interaction === 'pressed') return 'none';
  if (variant === 'ghost') return 'ghost';
  if (variant === 'solid' || variant === 'outline') return 'gradient';
  return 'flat';
}

function strokeColorFor(
  strokeMode: FigmaButtonMatrixCell['strokeMode'],
): string | null {
  const { colors } = figmaButtonTokens;
  if (strokeMode === 'ghost') return colors.ghostStroke;
  if (strokeMode === 'flat') return colors.flatStroke;
  return null;
}

function activeOverlay(variant: FigmaButtonVariant): string {
  const { overlay } = figmaButtonTokens;
  if (variant === 'solid') return overlay.solidActive;
  if (variant === 'muted') return overlay.mutedActive;
  return overlay.outlineGhostActive;
}

export function figmaButtonMatrixCell(
  variant: FigmaButtonVariant,
  interaction: FigmaButtonInteraction,
): FigmaButtonMatrixCell {
  const { colors, metrics, disabledOpacity } = figmaButtonTokens;
  const labelColor =
    variant === 'solid' ? colors.labelOnSolid : colors.labelDefault;
  const radius =
    interaction === 'disabled' && variant === 'solid'
      ? metrics.disabledSolidRadius
      : metrics.radius;

  if (interaction === 'disabled') {
    const fill =
      variant === 'solid'
        ? colors.solidDisabledFill
        : variant === 'muted'
          ? colors.mutedFill
          : colors.canvas;
    return {
      fill,
      overlay: null,
      labelColor,
      borderRadius: radius,
      strokeMode: strokeModeFor(variant, interaction),
      strokeColor: strokeColorFor(strokeModeFor(variant, interaction)),
      controlOpacity: disabledOpacity,
      pressedGhostInset: false,
    };
  }

  const fill = baseFill(variant);
  const active = interaction === 'hover' || interaction === 'pressed';
  const overlay = active ? activeOverlay(variant) : null;
  const strokeMode = strokeModeFor(variant, interaction);

  return {
    fill,
    overlay,
    labelColor,
    borderRadius: radius,
    strokeMode,
    strokeColor: strokeColorFor(strokeMode),
    controlOpacity: 1,
    pressedGhostInset: variant === 'ghost' && interaction === 'pressed',
  };
}

/** Expand hit slop so a hugged control still meets the 44px touch target on both axes. */
export function figmaButtonHitSlop(measured: {
  width?: number;
  height?: number;
}) {
  const min = figmaButtonTokens.metrics.minTouchTarget;
  const height = measured.height ?? figmaButtonContentHeight();
  const width = measured.width ?? 0;
  const verticalDeficit = Math.max(0, min - height);
  const horizontalDeficit = width > 0 ? Math.max(0, min - width) : 0;
  if (verticalDeficit <= 0 && horizontalDeficit <= 0) return undefined;
  return {
    top: Math.ceil(verticalDeficit / 2),
    bottom: Math.ceil(verticalDeficit / 2),
    left: Math.ceil(horizontalDeficit / 2),
    right: Math.ceil(horizontalDeficit / 2),
  };
}

/** Padding and label metrics. Paint stays on the shared matrix. */
export function figmaButtonSizeMetrics(size: FigmaButtonSize = 'matrix') {
  if (size === 'auth') {
    return {
      paddingX: figmaButtonTokens.metrics.paddingX,
      paddingY: designTokens.space.x3,
      typography: figmaButtonTokens.typography,
    };
  }
  if (size === 'suggestion') {
    return {
      paddingX: designTokens.auth.suggestionX,
      paddingY: designTokens.auth.suggestionY,
      typography: designTokens.typography.authSuggestion,
    };
  }
  if (size === 'navigation') {
    return {
      paddingX: 16.5,
      paddingY: 10,
      typography: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: -0.28,
        fontWeight: '500' as const,
      },
    };
  }
  if (size === 'exitConfirm') {
    return {
      paddingX: 14,
      paddingY: 14,
      typography: {
        ...figmaButtonTokens.typography,
        fontFamily: 'Inter_500Medium',
        fontWeight: '500' as const,
      },
    };
  }
  if (size === 'event') {
    return {
      paddingX: 16,
      paddingY: 10,
      typography: figmaButtonTokens.typography,
    };
  }
  if (size === 'pickerAction') {
    return {
      paddingX: 16,
      paddingY: 12,
      typography: {
        ...figmaButtonTokens.typography,
        fontFamily: 'Inter_500Medium',
        fontWeight: '500' as const,
      },
    };
  }
  return {
    paddingX: figmaButtonTokens.metrics.paddingX,
    paddingY: figmaButtonTokens.metrics.paddingY,
    typography: figmaButtonTokens.typography,
  };
}

export function figmaButtonContentHeight(size: FigmaButtonSize = 'matrix') {
  if (size === 'navigation') {
    return 47;
  }
  if (size === 'event') return 47;
  if (size === 'exitConfirm') {
    return designTokens.auth.exitActionHeight;
  }
  const { paddingY, typography } = figmaButtonSizeMetrics(size);
  const { strokeWidth } = figmaButtonTokens.metrics;
  return (paddingY + strokeWidth) * 2 + typography.lineHeight;
}
