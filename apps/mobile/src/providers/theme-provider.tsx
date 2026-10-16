import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';

import {
  appColorMaps,
  type AppThemeName,
  type SemanticColorMap,
} from '@bidplace/design-tokens';

/**
 * One React owner of the active semantic color map. Components resolve
 * theme-dependent colors through `useAppTheme()` inside render — never from
 * module-level snapshots — so switching `theme` re-renders consumers without
 * remounting screens. Default stays light; there is intentionally no user
 * switch, system follow, or persisted preference yet.
 */

const ThemeContext = createContext<AppThemeName>('light');

export function useAppThemeName(): AppThemeName {
  return useContext(ThemeContext);
}

export function useAppTheme(): SemanticColorMap {
  return appColorMaps[useContext(ThemeContext)];
}

export function ThemeProvider({
  children,
  theme = 'light',
}: {
  children: ReactNode;
  theme?: AppThemeName;
}) {
  const colors = appColorMaps[theme];
  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.canvas,
        card: colors.surface,
        primary: colors.accent,
        border: colors.border,
        text: colors.ink,
        notification: colors.accent,
      },
    }),
    [colors],
  );

  // Web-only: the root attribute selects generated CSS theme blocks, and the
  // focus ring variable is fed from the same map (single source, no manual
  // CSS palette). Native ignores this — focus there is drawn by controls.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.bidplaceTheme = theme;
    document.documentElement.style.setProperty(
      '--bidplace-focus',
      colors.focus,
    );
  }, [theme, colors]);

  return (
    <ThemeContext.Provider value={theme}>
      <NavigationThemeProvider value={navigationTheme}>
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}
