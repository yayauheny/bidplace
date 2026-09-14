import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    visibility?: 'visible' | 'hidden' | 'collapse';
  }
}
