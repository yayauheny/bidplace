import { useId } from 'react';
import { View } from 'react-native';
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg';

import {
  figmaButtonMatrixCell,
  figmaButtonTokens,
  type FigmaButtonSize,
} from '@bidplace/design-tokens';

import { FigmaGlassSurface } from './FigmaGlassSurface';
import { useAppTheme } from '../../providers/theme-provider';
import {
  figmaButtonScaledGradientAxis,
  figmaButtonStrokeRadius,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
} from './figma-button-style';

export function FigmaButtonSurface({
  variant,
  size,
  interaction,
  width,
  height,
}: {
  variant: FigmaButtonVariant;
  size?: FigmaButtonSize;
  interaction: FigmaButtonInteraction;
  width: number;
  height: number;
}) {
  const palette = useAppTheme();
  const instanceId = useId().replace(/:/g, '');
  if (width <= 0 || height <= 0) return null;

  const cell = figmaButtonMatrixCell(variant, interaction, palette);
  if (size === 'sheetAction' && variant === 'solid') {
    cell.fill = palette.inkStrong;
    cell.strokeMode = 'flat';
    cell.strokeColor = palette.borderStrong;
  }
  if (size === 'sheetAction' && variant === 'ghost') {
    return (
      <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
        <FigmaGlassSurface preset="action" style={{ width, height }}>
          {cell.overlay ? (
            <View style={{ width, height, backgroundColor: cell.overlay }} />
          ) : null}
        </FigmaGlassSurface>
      </View>
    );
  }
  const { metrics } = figmaButtonTokens;
  const strokeWidth = cell.strokeMode === 'none' ? 0 : metrics.strokeWidth;
  // Node 292:5046 paints an integer 82×42 frame at the original origin.
  const paintWidth = cell.pressedGhostInset
    ? Math.round(width) - (metrics.sampleWidth - metrics.pressedGhostWidth)
    : width;
  const paintHeight = cell.pressedGhostInset
    ? Math.round(height) - (metrics.sampleHeight - metrics.pressedGhostHeight)
    : height;
  const radius = figmaButtonStrokeRadius({
    borderRadius: cell.borderRadius,
    width: paintWidth,
    height: paintHeight,
    strokeWidth,
  });
  const rect = {
    x: strokeWidth / 2,
    y: strokeWidth / 2,
    width: paintWidth - strokeWidth,
    height: paintHeight - strokeWidth,
    rx: radius,
    ry: radius,
  };
  const gradientVariant = variant === 'solid' ? 'solid' : 'outline';
  const axis = figmaButtonScaledGradientAxis(
    gradientVariant,
    width,
    height,
    palette,
  );
  const gradientId = `figma-button-${gradientVariant}-${instanceId}`;

  return (
    <Svg
      pointerEvents="none"
      aria-hidden
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {cell.strokeMode === 'gradient' ? (
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
      ) : null}
      <Rect {...rect} fill={cell.fill} />
      {cell.overlay ? <Rect {...rect} fill={cell.overlay} /> : null}
      {cell.strokeMode !== 'none' ? (
        <Rect
          {...rect}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={
            cell.strokeMode === 'gradient'
              ? `url(#${gradientId})`
              : (cell.strokeColor ?? undefined)
          }
        />
      ) : null}
    </Svg>
  );
}
