import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { INFRASTRUCTURE_ERROR_COPY } from '../../errors';
import { AppText, SecondaryButton } from '../ui';
import {
  INFRASTRUCTURE_ERROR_TEXT_ROLE,
  showsInfrastructureErrorLogo,
  type InfrastructureErrorPresentation,
} from './infrastructure-error-presentation';
import { InfrastructurePageStatus } from './InfrastructurePageStatus';

export type { InfrastructureErrorPresentation } from './infrastructure-error-presentation';
export { showsInfrastructureErrorLogo } from './infrastructure-error-presentation';

export function InfrastructureErrorState({
  onRetry,
  presentation = 'page',
}: {
  onRetry: () => void;
  presentation?: InfrastructureErrorPresentation;
}) {
  if (!showsInfrastructureErrorLogo(presentation)) {
    return (
      <View
        testID="infrastructure-error-state-inline"
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{
          width: '100%',
          alignItems: 'center',
          gap: designTokens.space.x3,
          paddingVertical: designTokens.space.x6,
        }}
      >
        <AppText role={INFRASTRUCTURE_ERROR_TEXT_ROLE} style={{ textAlign: 'center' }}>
          {INFRASTRUCTURE_ERROR_COPY}
        </AppText>
        <SecondaryButton label="Повторить" onPress={onRetry} width="full" />
      </View>
    );
  }

  return <InfrastructurePageStatus status="error" onRetry={onRetry} />;
}
