import { type ReactNode } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { InfrastructureErrorState } from '../../../components/shared/InfrastructureErrorState';
import { PageState } from '../../../components/ui/PageState';

export function SearchPaneStatus({
  isPending,
  isError,
  onRetry,
  isEmpty,
  loading,
  children,
  controls,
  keepControlsOnEmpty = false,
}: {
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  isEmpty: boolean;
  loading: ReactNode;
  children: ReactNode;
  controls?: ReactNode;
  keepControlsOnEmpty?: boolean;
}) {
  const empty = !isPending && !isError && isEmpty;
  return (
    <View style={{ flexGrow: 1, gap: designTokens.space.x5 }}>
      {controls != null ? (
        <View
          style={
            empty && !keepControlsOnEmpty ? { display: 'none' } : undefined
          }
        >
          {controls}
        </View>
      ) : null}
      {isError ? (
        <InfrastructureErrorState presentation="inline" onRetry={onRetry} />
      ) : isPending ? (
        loading
      ) : empty ? (
        <PageState
          variant="search"
          title="Ничего не найдено"
          message="Попробуйте изменить запрос или выбрать другой раздел"
        />
      ) : (
        children
      )}
    </View>
  );
}
