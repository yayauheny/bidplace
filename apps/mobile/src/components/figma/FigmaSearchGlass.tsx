import { useState, type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import {
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { figmaTokens, searchChromeTokens, type SearchChromeKind } from '@bidplace/design-tokens';

import { FigmaSearchChromeStroke } from './FigmaSearchChromeStroke';

export function FigmaSearchGlass({
  kind,
  children,
  style,
  testID,
}: {
  kind: SearchChromeKind;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const shape = searchChromeTokens[kind];
  const blurred = kind !== 'rail';

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[
        {
          height: shape.sampleHeight,
          borderRadius: shape.radius,
          overflow: 'visible',
          position: 'relative',
        },
        style,
      ]}
    >
      {blurred ? (
        <BlurView
          pointerEvents="none"
          intensity={figmaTokens.blur.dockNativeIntensity}
          tint="default"
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          blurReductionFactor={figmaTokens.blur.dockAndroidReductionFactor}
          style={[StyleSheet.absoluteFill, { borderRadius: shape.radius }]}
        />
      ) : null}
      {blurred ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: shape.radius,
              backgroundColor: searchChromeTokens.fill,
            },
          ]}
        />
      ) : null}
      {children}
      <FigmaSearchChromeStroke kind={kind} width={size.width} height={size.height} />
    </View>
  );
}
