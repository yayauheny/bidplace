import type { CSSProperties, ReactNode, RefObject } from 'react';
import type { StyleProp, View, ViewStyle } from 'react-native';

import {
  figmaGlassSurfaceSpec,
  type FigmaGlassSurfacePreset,
} from './figma-glass-surface-style';

type GlassCssProperties = CSSProperties & {
  '--figma-glass-background': string;
  '--figma-glass-blur': string;
  '--figma-glass-border-end': string;
  '--figma-glass-border-start': string;
  '--figma-glass-radius': string;
  '--figma-glass-stroke-width': string;
};

export function FigmaGlassSurface({
  children,
  preset = 'controlGroup',
  style,
  contentStyle,
  contentClassName,
  testID,
  accessibilityRole,
  accessibilityLabel,
}: {
  children: ReactNode;
  preset?: FigmaGlassSurfacePreset;
  blurTarget?: RefObject<View | null>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  contentClassName?: string;
  testID?: string;
  accessibilityRole?: string;
  accessibilityLabel?: string;
}) {
  const spec = figmaGlassSurfaceSpec(preset);
  const glassStyle: GlassCssProperties = {
    '--figma-glass-background': spec.background,
    '--figma-glass-blur': `${spec.blur}px`,
    '--figma-glass-border-start': spec.borderStart,
    '--figma-glass-border-end': spec.borderEnd,
    '--figma-glass-radius': `${spec.borderRadius}px`,
    '--figma-glass-stroke-width': `${spec.borderWidth}px`,
    ...(plainStyle(style) ?? {}),
  };

  return (
    <div className="figma-glass" data-testid={testID} style={glassStyle}>
      <div
        className="figma-glass-backdrop"
        data-testid="figma-glass-backdrop"
        aria-hidden="true"
      />
      <div
        className="figma-glass-stroke"
        data-testid="figma-glass-stroke"
        aria-hidden="true"
      />
      <div
        className={['figma-glass-content', contentClassName]
          .filter(Boolean)
          .join(' ')}
        role={accessibilityRole}
        aria-label={accessibilityLabel}
        style={plainStyle(contentStyle)}
      >
        {children}
      </div>
    </div>
  );
}

function plainStyle(
  style?: StyleProp<ViewStyle>,
): CSSProperties | undefined {
  if (!style || typeof style !== 'object' || Array.isArray(style)) {
    return undefined;
  }

  return style as CSSProperties;
}
