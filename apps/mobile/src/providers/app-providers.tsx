import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { AnalyticsProvider } from './analytics-provider';
import { ApiProvider } from './api-provider';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApiProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ApiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
