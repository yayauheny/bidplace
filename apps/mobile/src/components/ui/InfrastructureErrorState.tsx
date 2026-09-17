import { INFRASTRUCTURE_ERROR_COPY } from '../../errors';
import { PageState } from './PageState';

export function InfrastructureErrorState({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return <PageState title={INFRASTRUCTURE_ERROR_COPY} retry={onRetry} />;
}
