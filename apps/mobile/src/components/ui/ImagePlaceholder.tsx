import { View, type StyleProp, type ViewStyle } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaImagePlaceholder } from '../figma/FigmaImagePlaceholder';
import { figmaImagePlaceholderSpec } from '../figma/figma-image-placeholder';

export function ImagePlaceholder({
  ratio = designTokens.ratio.productPortrait,
  label = 'Изображение недоступно',
  style,
}: {
  ratio?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          aspectRatio: ratio,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: designTokens.radius.image,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View
        style={{
          width: figmaImagePlaceholderSpec.relativeWidth,
          maxWidth: figmaImagePlaceholderSpec.width,
          aspectRatio:
            figmaImagePlaceholderSpec.width /
            figmaImagePlaceholderSpec.height,
        }}
      >
        <FigmaImagePlaceholder width="100%" height="100%" label={label} />
      </View>
    </View>
  );
}
