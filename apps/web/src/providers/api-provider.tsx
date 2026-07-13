'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { createWebApiClient } from '../lib/api';

import type { ApiClient } from '@bidplace/api-client';

const ApiContext = createContext<ApiClient | null>(null);
const PublicApiUrlContext = createContext<string | null>(null);

export function ApiProvider({
  children,
  baseUrl,
}: {
  children: ReactNode;
  baseUrl: string;
}) {
  const [client] = useState(() => createWebApiClient(baseUrl));

  return (
    <PublicApiUrlContext.Provider value={baseUrl}>
      <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
    </PublicApiUrlContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error('useApiClient must be used within ApiProvider');
  }

  return context;
}

export function usePublicApiUrl(): string {
  const context = useContext(PublicApiUrlContext);

  if (!context) {
    throw new Error('usePublicApiUrl must be used within ApiProvider');
  }

  return context;
}
