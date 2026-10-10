/**
 * Text-button geometry and 16-cell visual matrix from Figma `292:5058`.
 * Button-only colors; does not replace shared field/chip/quietFill tokens.
 */
export const figmaButtonVariants = ['solid', 'outline', 'ghost', 'muted'] as const;
export type FigmaButtonVariant = (typeof figmaButtonVariants)[number];

export const figmaButtonInteractions = [
  'idle',
  'hover',
  'pressed',
  'disabled',
] as const;
export type FigmaButtonInteraction = (typeof figmaButtonInteractions)[number];

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
    labelDefault: '#565656',
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
      strokeMode:
        variant === 'solid' || variant === 'outline' ? 'gradient' : 'flat',
      strokeColor:
        variant === 'ghost' || variant === 'muted'
          ? variant === 'ghost'
            ? colors.ghostStroke
            : colors.flatStroke
          : null,
      controlOpacity: disabledOpacity,
      pressedGhostInset: false,
    };
  }

  const fill = baseFill(variant);
  const active =
    interaction === 'hover' || interaction === 'pressed';
  const overlay = active ? activeOverlay(variant) : null;
  const pressedGhost =
    variant === 'ghost' && interaction === 'pressed';

  let strokeMode: FigmaButtonMatrixCell['strokeMode'];
  if (pressedGhost) {
    strokeMode = 'none';
  } else if (variant === 'solid' || variant === 'outline') {
    strokeMode = 'gradient';
  } else if (variant === 'ghost') {
    strokeMode = 'ghost';
  } else {
    strokeMode = 'flat';
  }

  return {
    fill,
    overlay,
    labelColor,
    borderRadius: radius,
    strokeMode,
    strokeColor:
      strokeMode === 'ghost'
        ? colors.ghostStroke
        : strokeMode === 'flat'
          ? colors.flatStroke
          : null,
    controlOpacity: 1,
    pressedGhostInset: pressedGhost,
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

export function figmaButtonContentHeight() {
  const { paddingY, strokeWidth } = figmaButtonTokens.metrics;
  const line = figmaButtonTokens.typography.lineHeight;
  return (paddingY + strokeWidth) * 2 + line;
}
