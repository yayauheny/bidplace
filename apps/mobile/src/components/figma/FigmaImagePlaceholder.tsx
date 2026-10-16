import { G, Path, Svg, type NumberProp } from 'react-native-svg';
import { Platform } from 'react-native';

import { useAppTheme } from '../../providers/theme-provider';
import {
  figmaImagePlaceholderPath,
  figmaImagePlaceholderSpec,
} from './figma-image-placeholder';

export function FigmaImagePlaceholder({
  width = figmaImagePlaceholderSpec.width,
  height = figmaImagePlaceholderSpec.height,
  color,
  label,
}: {
  width?: NumberProp;
  height?: NumberProp;
  color?: string;
  label?: string;
}) {
  const palette = useAppTheme();
  const transform = `rotate(${figmaImagePlaceholderSpec.rotation} ${figmaImagePlaceholderSpec.rotationOriginX} ${figmaImagePlaceholderSpec.rotationOriginY})`;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${figmaImagePlaceholderSpec.width} ${figmaImagePlaceholderSpec.height}`}
      {...(Platform.OS === 'web'
        ? label
          ? { role: 'img' as const, 'aria-label': label }
          : { 'aria-hidden': true as const }
        : {
            accessibilityLabel: label,
            accessibilityRole: label ? ('image' as const) : undefined,
            accessible: Boolean(label),
          })}
    >
      <G transform={transform}>
        <Path
          d={figmaImagePlaceholderPath}
          fill={color ?? palette.ink}
          fillRule="nonzero"
        />
      </G>
    </Svg>
  );
}
