'use client';

import type { ReactNode } from 'react';

import { ApiProvider } from './api-provider';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({
  children,
  baseUrl,
}: {
  children: ReactNode;
  baseUrl: string;
}) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <ApiProvider baseUrl={baseUrl}>
          <AuthProvider>{children}</AuthProvider>
        </ApiProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
