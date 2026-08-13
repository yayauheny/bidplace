import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';
import {
  ambientGradientColors,
  ambientGradientLocations,
  ambientImageOverscanScale,
} from './ambient-image-background-style';

export function AmbientImageBackground({ imageUrl }: { imageUrl?: string }) {
  const reducedMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLoaded(false);
    opacity.stopAnimation();
    opacity.setValue(0);
  }, [imageUrl, opacity]);

  useEffect(() => {
    if (!loaded) return;

    Animated.timing(opacity, {
      toValue: 1,
      duration: getMotionDuration(reducedMotion, 360),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [loaded, opacity, reducedMotion]);

  return (
    <View
      testID="ambient-image-background"
      aria-hidden
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: 'hidden',
          backgroundColor: designTokens.color.surfaceWarm,
          pointerEvents: 'none',
        },
      ]}
    >
      {imageUrl ? (
        <Animated.View
          testID="ambient-image-background-image"
          style={[
            StyleSheet.absoluteFill,
            {
              opacity,
              transform: [{ scale: ambientImageOverscanScale }],
            },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            blurRadius={72}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
            style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          />
        </Animated.View>
      ) : null}
      <LinearGradient
        colors={ambientGradientColors}
        locations={ambientGradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
