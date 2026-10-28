import { type CSSProperties, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import {
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
          backgroundColor: blurred ? palette.glass : 'transparent',
          ...(blurStyle as object),
        },
        style,
      ]}
    >
      {children}
      <FigmaSearchChromeStroke
        kind={kind}
        width={layout.width}
        height={layout.height}
      />
    </View>
  );
}
