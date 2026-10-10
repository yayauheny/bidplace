import { useId } from 'react';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import { figmaButtonTokens } from '@bidplace/design-tokens';

import {
  figmaButtonFlatStrokeColor,
  figmaButtonGradientAxis,
  figmaButtonStrokeMode,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
} from './figma-button-style';

export function FigmaButtonGradientStroke({
  variant,
  interaction,
  borderRadius,
  width,
  height,
}: {
  variant: FigmaButtonVariant;
  interaction: FigmaButtonInteraction;
  borderRadius: number;
  width: number;
  height: number;
}) {
  const instanceId = useId().replace(/:/g, '');
  const strokeMode = figmaButtonStrokeMode(variant, interaction);
  const strokeWidth = figmaButtonTokens.metrics.strokeWidth;

  if (strokeMode === 'none' || width <= 0 || height <= 0) {
    return null;
  }

  const inset = strokeWidth / 2;
  const flatColor = figmaButtonFlatStrokeColor(variant, interaction);

  if (strokeMode === 'flat' || strokeMode === 'ghost') {
    return (
      <Svg
        pointerEvents="none"
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <Rect
          x={inset}
          y={inset}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          fill="none"
          stroke={flatColor ?? figmaButtonTokens.colors.flatStroke}
          strokeWidth={strokeWidth}
        />
      </Svg>
    );
  }

  const gradientVariant = variant === 'solid' ? 'solid' : 'outline';
  const axis = figmaButtonGradientAxis(gradientVariant);
  const gradientId = `figma-button-${gradientVariant}-${instanceId}`;

  return (
    <Svg
      pointerEvents="none"
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <Defs>
        <LinearGradient
          id={gradientId}
          x1={axis.x1}
          y1={axis.y1}
          x2={axis.x2}
          y2={axis.y2}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor={axis.start} />
          <Stop offset="1" stopColor={axis.end} />
        </LinearGradient>
      </Defs>
      <Rect
        x={inset}
        y={inset}
        width={width - strokeWidth}
        height={height - strokeWidth}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
