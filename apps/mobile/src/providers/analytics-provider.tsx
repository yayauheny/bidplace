import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

import {
  createAnalytics,
  type AnalyticsClient,
} from '../lib/analytics';
import { useApiClient } from './api-provider';
import { useAuth } from './auth-provider';

const AnalyticsContext = createContext<AnalyticsClient | null>(null);

function resolveAnalyticsPlatform(): 'web' | 'ios' | 'android' {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Platform.OS;
  }
  return 'web';
}

function isAnalyticsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'test' &&
    process.env.EXPO_PUBLIC_ANALYTICS_ENABLED !== 'false'
  );
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const api = useApiClient();
  const auth = useAuth();
  const hadUserRef = useRef(false);

  const analytics = useMemo(
    () =>
      createAnalytics({
        ingest: (body) => api.analytics.ingest(body),
        getEnvironment: () =>
          process.env.EXPO_PUBLIC_APP_ENV ||
          process.env.APP_ENV ||
          'local',
        getPlatform: resolveAnalyticsPlatform,
        getAppVersion: () => Constants.expoConfig?.version,
        isEnabled: isAnalyticsEnabled,
      }),
    [api],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      await analytics.init();
      if (!active) {
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      if (!active) {
        return;
      }
      await analytics.captureAttributionFromLaunch(
        initialUrl ?? undefined,
      );
    })();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void analytics.captureAttributionFromLaunch(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [analytics]);

  useEffect(() => {
    if (auth.user) {
      analytics.identify(auth.user.id);
      hadUserRef.current = true;
      return;
    }

    if (hadUserRef.current) {
      analytics.reset();
      hadUserRef.current = false;
    }
  }, [analytics, auth.user]);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsClient {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  return context;
}
