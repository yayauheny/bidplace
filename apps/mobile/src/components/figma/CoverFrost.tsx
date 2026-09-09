import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { figmaTokens } from '@bidplace/design-tokens';

import { getApiAssetUrl } from '../../lib/environment';
import { ResilientRemoteImage } from '../ui/ResilientRemoteImage';
import { webBackdropBlur } from './web-backdrop';

const overlayGradient = `linear-gradient(to bottom, rgba(0, 0, 0, 0), ${figmaTokens.color.overlay})`;

export function CoverFrost({
  imageUrl,
  imageLabel,
  children,
}: {
  imageUrl: string;
  imageLabel: string;
  children: ReactNode;
}) {
  return (
    <View style={{ alignSelf: 'stretch' }}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            borderTopLeftRadius: figmaTokens.radius.overlay,
            borderTopRightRadius: figmaTokens.radius.overlay,
          },
          webBackdropBlur(figmaTokens.blur.overlay),
        ]}
      >
        <ResilientRemoteImage
          uri={getApiAssetUrl(imageUrl)}
          component="CoverFrost"
          accessibilityLabel=""
          fallbackLabel={imageLabel}
          blurRadius={figmaTokens.blur.overlay}
          contentFit="cover"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            aspectRatio:
              figmaTokens.size.coverWidth / figmaTokens.size.coverHeight,
          }}
        />
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
            colors={['rgba(0, 0, 0, 0)', figmaTokens.color.overlay]}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View
        style={{
          padding: figmaTokens.space.coverPad,
          gap: figmaTokens.space.coverGap,
        }}
      >
        {children}
      </View>
    </View>
  );
}
