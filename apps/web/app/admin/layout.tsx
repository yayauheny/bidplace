import type { ReactNode } from 'react';

import { ProtectedRoute } from '../../src/components/shared/protected-route';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute requireAdmin>{children}</ProtectedRoute>;
}
