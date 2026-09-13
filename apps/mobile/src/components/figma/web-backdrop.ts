import { Platform, type ViewStyle } from 'react-native';

export function webBackdropBlur(px: number): ViewStyle {
  if (Platform.OS !== 'web') {
    return {};
  }

  return {
    backdropFilter: `blur(${px}px)`,
    // RN-web forwards unknown CSS; Safari needs the webkit prefix.
    WebkitBackdropFilter: `blur(${px}px)`,
  } as ViewStyle;
}

export function webFilterBlur(px: number): ViewStyle {
  if (Platform.OS !== 'web') {
    return {};
  }

  return { filter: `blur(${px}px)` } as ViewStyle;
}
