import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import {
  creatorAmbientLayers,
  productAmbientLayers,
  type AmbientBackgroundVariant,
} from './ambient-image-background-style';

export type { AmbientBackgroundVariant } from './ambient-image-background-style';

export function AmbientImageBackground({
  variant,
}: {
  variant: AmbientBackgroundVariant;
}) {
  return (
    <View
      testID="ambient-image-background"
      aria-hidden
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: 'hidden',
          pointerEvents: 'none',
          backgroundColor:
            variant === 'product'
              ? designTokens.color.surfaceWarm
              : designTokens.color.canvas,
        },
      ]}
    >
      {variant === 'product' ? (
        <>
          <LinearGradient
            colors={productAmbientLayers.cool}
            locations={[0, 0.38, 0.82]}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 0.82, y: 0.64 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={productAmbientLayers.warm}
            locations={[0, 0.44, 1]}
            start={{ x: 1, y: 0.12 }}
            end={{ x: 0.22, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={productAmbientLayers.veil}
            locations={[0, 0.58, 0.94]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : (
        <>
          <LinearGradient
            colors={creatorAmbientLayers.atmosphere}
            locations={[0, 0.46, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.72 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={creatorAmbientLayers.veil}
            locations={[0, 0.58, 0.9]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
    </View>
  );
}
