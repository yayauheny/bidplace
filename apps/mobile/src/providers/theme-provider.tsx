import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { type ReactNode } from 'react';

import { designTokens } from '@bidplace/design-tokens';

// MVP is light-only. Dark mode is not implemented.
// To add dark theme in the future: provide a new token map here, do not rewrite components.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: designTokens.color.canvas,
    card: designTokens.color.surface,
    primary: designTokens.color.accent,
    border: designTokens.color.border,
    text: designTokens.color.ink,
    notification: designTokens.color.accent,
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  );
}
