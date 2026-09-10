import { G, Path, Svg, type NumberProp } from 'react-native-svg';

import { figmaTokens } from '@bidplace/design-tokens';

import {
  figmaImagePlaceholderPath,
  figmaImagePlaceholderSpec,
} from './figma-image-placeholder';

export function FigmaImagePlaceholder({
  width = figmaImagePlaceholderSpec.width,
  height = figmaImagePlaceholderSpec.height,
  color = figmaTokens.color.ink,
  label,
}: {
  width?: NumberProp;
  height?: NumberProp;
  color?: string;
  label?: string;
}) {
  const transform = `rotate(${figmaImagePlaceholderSpec.rotation} ${figmaImagePlaceholderSpec.rotationOriginX} ${figmaImagePlaceholderSpec.rotationOriginY})`;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${figmaImagePlaceholderSpec.width} ${figmaImagePlaceholderSpec.height}`}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      accessible={Boolean(label)}
    >
      <G transform={transform}>
        <Path
          d={figmaImagePlaceholderPath}
          fill={color}
          fillRule="nonzero"
        />
      </G>
    </Svg>
  );
}
