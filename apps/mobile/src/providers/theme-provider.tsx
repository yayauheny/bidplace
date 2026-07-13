import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme,
} from '@react-navigation/native';
import { useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider } from 'tamagui';

import config from '../../tamagui.config';
import { darkTheme, lightTheme } from '../theme/tokens';

function buildNavigationTheme(mode: 'light' | 'dark'): Theme {
  const palette = mode === 'dark' ? darkTheme : lightTheme;
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: palette.background,
      card: palette.surface,
      primary: palette.primary,
      border: palette.border,
      text: palette.text,
      notification: palette.primary,
    },
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const themeName = colorScheme === 'dark' ? 'dark' : 'light';
  const navigationTheme = useMemo(
    () => buildNavigationTheme(themeName),
    [themeName],
  );

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <TamaguiProvider config={config} defaultTheme={themeName}>
        {children}
      </TamaguiProvider>
    </NavigationThemeProvider>
  );
}
