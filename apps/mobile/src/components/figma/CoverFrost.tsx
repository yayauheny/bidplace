import { type ReactNode } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getApiAssetUrl } from '../../lib/environment';
import { coverFrostSpec } from './cover-frost-style';
import { webBackdropBlur } from './web-backdrop';

export function CoverFrost({
  imageUrl,
  children,
}: {
  imageUrl: string;
  children: ReactNode;
}) {
  const platform = Platform.OS === 'web' ? 'web' : 'native';
  const spec = coverFrostSpec(platform);
  const overlayGradient = `linear-gradient(to bottom, ${spec.gradientStart}, ${spec.gradientEnd})`;

  return (
    <View style={{ alignSelf: 'stretch' }}>
      <View
        aria-hidden
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        testID="figma-cover-frost"
        style={[
          StyleSheet.absoluteFill,
          {
            pointerEvents: 'none',
            overflow: 'hidden',
            borderTopLeftRadius: spec.topRadius,
            borderTopRightRadius: spec.topRadius,
          },
          spec.usesBackdropSampling ? webBackdropBlur(spec.runtimeBlur) : null,
        ]}
      >
        {spec.usesDecorativeArtworkFallback ? (
          <Image
            accessible={false}
            source={{ uri: getApiAssetUrl(imageUrl) }}
            blurRadius={spec.runtimeBlur}
            contentFit="cover"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              aspectRatio: spec.artworkAspectRatio,
            }}
          />
        ) : null}
        {Platform.OS === 'web' ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundImage: overlayGradient,
              } as ViewStyle,
            ]}
          />
        ) : (
          <LinearGradient
            colors={[spec.gradientStart, spec.gradientEnd]}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View
        style={{
          padding: spec.contentPadding,
          gap: spec.contentGap,
        }}
      >
        {children}
      </View>
    </View>
  );
}
