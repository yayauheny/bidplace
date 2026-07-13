'use client';

import { NextThemeProvider, useRootTheme } from '@tamagui/next-theme';
import { type ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';

import config from '../../tamagui.config';

function ThemeBridge({ children }: { children: ReactNode }) {
  const [theme] = useRootTheme({ fallback: 'light' });

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={theme}
      disableInjectCSS
      disableRootThemeClass
    >
      {children}
    </TamaguiProvider>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      themes={['light', 'dark']}
      defaultTheme="light"
      enableColorScheme
      enableSystem
      storageKey="bidplace.theme"
      attribute="class"
      value={{ light: 't_light', dark: 't_dark' }}
      skipNextHead
      disableTransitionOnChange
    >
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemeProvider>
  );
}
