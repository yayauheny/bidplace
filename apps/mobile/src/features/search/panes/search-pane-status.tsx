import { type ReactNode } from 'react';

import { InfrastructureErrorState } from '../../../components/shared/InfrastructureErrorState';
import { PageState } from '../../../components/ui/PageState';

export function SearchPaneStatus({
  isPending,
  isError,
  onRetry,
  isEmpty,
  emptyTitle,
  loading,
  children,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  emptyTitle: string;
  loading: ReactNode;
  children: ReactNode;
}) {
  if (isError) {
    return <InfrastructureErrorState presentation="inline" onRetry={onRetry} />;
  }
  if (isPending) {
    return loading;
  }
  if (isEmpty) {
    return <PageState title={emptyTitle} />;
  }
  return children;
}
