import { Platform, StyleSheet, View } from 'react-native';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { authorAtmosphereSpec } from './author-atmosphere-style';
import { webFilterBlur } from './web-backdrop';

export function AuthorAtmosphere({
  imageUrl,
  fullName,
}: {
  imageUrl: string;
  fullName: string;
}) {
  const spec = authorAtmosphereSpec();

  return (
    <View
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        top: spec.top,
        left: spec.left,
        width: spec.width,
        height: spec.height,
        opacity: spec.opacity,
        overflow: 'visible',
        zIndex: 0,
        ...webFilterBlur(spec.blur),
      }}
    >
      <View
        style={{
          width: spec.width,
          height: spec.height,
          borderBottomLeftRadius: spec.bottomRadius,
          borderBottomRightRadius: spec.bottomRadius,
          overflow: 'hidden',
        }}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(imageUrl)}
          component="AuthorAtmosphere"
          accessibilityLabel=""
          fallbackLabel={`Фон автора ${fullName}`}
          blurRadius={Platform.OS === 'web' ? undefined : spec.blur}
          contentFit="cover"
          style={{ width: spec.width, height: spec.height }}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: spec.wash, pointerEvents: 'none' },
          ]}
        />
      </View>
    </View>
  );
}
