import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

export const pageColumnStyle = StyleSheet.create({
  column: {
    width: '100%',
    maxWidth: designTokens.layout.contentMax + 2 * designTokens.layout.gutter,
    paddingHorizontal: designTokens.layout.gutter,
    minWidth: 0,
    alignSelf: 'center',
    overflow: 'visible',
  },
}).column;

export function PageColumn({ style, ...props }: ComponentProps<typeof View>) {
  return <View {...props} style={[pageColumnStyle, style]} />;
}
