import type { ReactNode } from 'react';

import { ProtectedRoute } from '../../src/components/shared/protected-route';

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
