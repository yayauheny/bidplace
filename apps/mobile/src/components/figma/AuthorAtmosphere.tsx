import { Platform, StyleSheet, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { webFilterBlur } from './web-backdrop';

export function AuthorAtmosphere({
  imageUrl,
  fullName,
}: {
  imageUrl: string;
  fullName: string;
}) {
  const size = figmaTokens.size.authorAtmosphere;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -figmaTokens.space.atmosphereOffset,
        left: '50%',
        width: size,
        height: size,
        marginLeft: -size / 2,
        opacity: figmaTokens.opacity.atmosphere,
        overflow: 'visible',
        zIndex: 0,
        // Figma puts blur-[40px] on this 485 box, not on a clipped inner image.
        ...webFilterBlur(figmaTokens.blur.atmosphere),
      }}
    >
      <ResilientRemoteImage
        uri={getApiAssetUrl(imageUrl)}
        component="AuthorAtmosphere"
        accessibilityLabel=""
        fallbackLabel={`Фон автора ${fullName}`}
        blurRadius={
          Platform.OS === 'web' ? undefined : figmaTokens.blur.atmosphere
        }
        contentFit="cover"
        style={{ width: size, height: size }}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: figmaTokens.color.atmosphereScrim },
        ]}
      />
    </View>
  );
}
