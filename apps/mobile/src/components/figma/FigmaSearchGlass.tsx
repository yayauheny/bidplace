import { type ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  designTokens,
  searchChromeTokens,
  type SearchChromeKind,
} from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { FigmaSearchChromeStroke } from './FigmaSearchChromeStroke';
import { useCssBorderBox } from './use-css-border-box';

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
  const { layout, onLayout } = useCssBorderBox();
  const palette = useAppTheme();
  const shape = searchChromeTokens[kind];
  const blurred = kind !== 'rail';

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
          intensity={designTokens.blur.dockNativeIntensity}
          tint="default"
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          blurReductionFactor={designTokens.blur.dockAndroidReductionFactor}
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
              backgroundColor: palette.glass,
            },
          ]}
        />
      ) : null}
      {children}
      <FigmaSearchChromeStroke
        kind={kind}
        width={layout.width}
        height={layout.height}
      />
    </View>
  );
}
