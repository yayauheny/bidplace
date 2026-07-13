import { createContext, useContext, useState, type ReactNode } from 'react';

import type { ApiClient } from '@bidplace/api-client';

import { createMobileApiClient } from '../lib/api';

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createMobileApiClient());

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApiClient(): ApiClient {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error('useApiClient must be used within ApiProvider');
  }

  return context;
}
