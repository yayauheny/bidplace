import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { type ReactNode } from 'react';

import { modernTokens } from '@bidplace/design-tokens';

// MVP is light-only. Dark mode is not implemented.
// To add dark theme in the future: provide a new token map here, do not rewrite components.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: modernTokens.color.canvas,
    card: modernTokens.color.surface,
    primary: modernTokens.color.accent,
    border: modernTokens.color.border,
    text: modernTokens.color.ink,
    notification: modernTokens.color.accent,
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}
