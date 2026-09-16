import { designTokens } from '@bidplace/design-tokens';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { authorAtmosphereSpec } from './author-atmosphere-style';
import { webFilterBlur } from './web-backdrop';

export function AuthorAtmosphere({
  imageUrl,
  fullName,
  compact = false,
}: {
  imageUrl: string;
  fullName: string;
  compact?: boolean;
}) {
  const spec = authorAtmosphereSpec();

  return (
    <View
      aria-hidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        StyleSheet.absoluteFill,
        { pointerEvents: 'none' },
        Platform.OS === 'web' &&
          ({
            maskImage: `linear-gradient(to bottom, black calc(100% - ${spec.maskFade}px), transparent 100%)`,
            WebkitMaskImage: `linear-gradient(to bottom, black calc(100% - ${spec.maskFade}px), transparent 100%)`,
          } as ViewStyle),
      ]}
    >
      <View
        testID="author-atmosphere"
        aria-hidden
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          top: compact
            ? designTokens.space.creatorCompactAtmosphereTop
            : spec.top,
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
    </View>
  );
}
