import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { searchChromeTokens, type SearchChromeKind } from '@bidplace/design-tokens';

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

  const blurStyle: CSSProperties | undefined = blurred
    ? {
        backdropFilter: `blur(${searchChromeTokens.blur.cssPx}px)`,
        WebkitBackdropFilter: `blur(${searchChromeTokens.blur.cssPx}px)`,
      }
    : undefined;

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
          backgroundColor: blurred ? searchChromeTokens.fill : 'transparent',
          ...(blurStyle as object),
        },
        style,
      ]}
    >
      {children}
      <FigmaSearchChromeStroke kind={kind} width={size.width} height={size.height} />
    </View>
  );
}
