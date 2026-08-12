import { Image } from 'expo-image';
import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { designTokens } from '@bidplace/design-tokens';

import { getMotionDuration, useReducedMotion } from '../../lib/reduced-motion';

const fadeStops = [
  { top: '42%', opacity: 0.04 },
  { top: '50%', opacity: 0.12 },
  { top: '58%', opacity: 0.24 },
  { top: '66%', opacity: 0.4 },
  { top: '74%', opacity: 0.58 },
  { top: '82%', opacity: 0.74 },
  { top: '90%', opacity: 0.88 },
  { top: '96%', opacity: 0.96 },
] as const;

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
      useNativeDriver: true,
    }).start();
  }, [loaded, opacity, reducedMotion]);

  return (
    <View
      testID="ambient-image-background"
      aria-hidden
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: 'hidden',
          backgroundColor: designTokens.color.surfaceWarm,
        },
      ]}
    >
      {imageUrl ? (
        <Animated.View
          testID="ambient-image-background-image"
          style={[StyleSheet.absoluteFill, { opacity }]}
        >
          <Image
            source={{ uri: imageUrl }}
            contentFit="cover"
            blurRadius={64}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
            style={[
              StyleSheet.absoluteFill,
              { width: '100%', height: '100%' },
            ]}
          />
        </Animated.View>
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(251, 251, 248, 0.72)' },
        ]}
      />
      {fadeStops.map((stop) => (
        <View
          key={stop.top}
          style={{
            position: 'absolute',
            top: stop.top,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: `rgba(251, 251, 248, ${stop.opacity})`,
          }}
        />
      ))}
    </View>
  );
}
