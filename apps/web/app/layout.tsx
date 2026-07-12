import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { loadPublicEnv } from '../src/env';

const publicEnv = loadPublicEnv();

export const metadata: Metadata = {
  title: 'Auction Platform',
  description: 'Auction platform foundation scaffold',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body data-api-url={publicEnv.NEXT_PUBLIC_API_URL}>{children}</body>
    </html>
  );
}
