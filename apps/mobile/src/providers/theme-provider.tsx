import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { type ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';

import config from '../../tamagui.config';
import { lightTheme } from '../theme/tokens';

// MVP is light-only. Dark mode is not implemented.
// To add dark theme in the future: provide a new token map here, do not rewrite components.
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: lightTheme.background,
    card: lightTheme.surface,
    primary: lightTheme.primary,
    border: lightTheme.borderColor,
    text: lightTheme.color,
    notification: lightTheme.primary,
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NavigationThemeProvider value={navigationTheme}>
      <TamaguiProvider config={config} defaultTheme="light">
        {children}
      </TamaguiProvider>
    </NavigationThemeProvider>
  );
}
