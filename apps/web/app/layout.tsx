import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SiteHeader } from '../src/components/shared/site-header';
import { Screen } from '../src/components/ui/layout';
import { AppProviders } from '../src/providers/app-providers';
import { loadPublicEnv } from '../src/env';

import '../public/tamagui.generated.css';

const publicEnv = loadPublicEnv();

export const metadata: Metadata = {
  title: 'BidPlace',
  description: 'Auction marketplace foundation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body data-api-url={publicEnv.NEXT_PUBLIC_API_URL}>
        <AppProviders>
          <Screen>
            <SiteHeader />
            {children}
          </Screen>
        </AppProviders>
      </body>
    </html>
  );
}
