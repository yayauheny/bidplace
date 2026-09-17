import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { INFRASTRUCTURE_ERROR_COPY } from '../../errors';
import { useReducedMotion } from '../../lib/reduced-motion';
import { AnimatedBidplaceLogo } from '../branding/AnimatedBidplaceLogo';
import { BIDPLACE_PAGE_LOGO_SIZE } from '../branding/bidplace-logo-mark';
import { AppText, SecondaryButton } from '../ui';
import {
  INFRASTRUCTURE_ERROR_COPY_MAX_WIDTH,
  INFRASTRUCTURE_ERROR_TEXT_ROLE,
  infrastructurePageErrorLayout,
} from './infrastructure-error-presentation';
import {
  infrastructurePageVisual,
  type InfrastructurePageVisualStatus,
} from './infrastructure-page-status';

export function InfrastructurePageStatus({
  status,
  onRetry,
}: {
  status: InfrastructurePageVisualStatus;
  onRetry: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [settled, setSettled] = useState(status !== 'loading');
  const statusRef = useRef(status);
  const canWaitForCycle = Platform.OS === 'web' && !reducedMotion;
  statusRef.current = status;

  useEffect(() => {
    if (status === 'loading') {
      setSettled(false);
      return;
    }
    if (!canWaitForCycle) {
      setSettled(true);
    }
  }, [canWaitForCycle, status]);

  const visual = infrastructurePageVisual(status, settled);
  const chromeStyle = {
    opacity: visual.showsErrorChrome ? 1 : 0,
    visibility: visual.showsErrorChrome ? 'visible' : 'hidden',
  } as const;

  return (
    <View
      testID={
        visual.showsErrorChrome
          ? 'infrastructure-error-state-page'
          : 'infrastructure-page-status-loading'
      }
      accessibilityRole={visual.showsErrorChrome ? 'alert' : undefined}
      accessibilityState={{ busy: !visual.showsErrorChrome }}
      accessibilityLiveRegion="polite"
      accessibilityLabel={visual.showsErrorChrome ? undefined : 'Загрузка'}
      style={{
        flex: 1,
        width: '100%',
        paddingHorizontal: infrastructurePageErrorLayout.padX,
        paddingBottom: designTokens.size.dockReserve,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: infrastructurePageErrorLayout.clusterGap,
          paddingBottom: infrastructurePageErrorLayout.clusterLift,
        }}
      >
        <AnimatedBidplaceLogo
          motion={visual.logoMotion}
          size={BIDPLACE_PAGE_LOGO_SIZE}
          onLoadingCycleEnd={() => {
            if (statusRef.current === 'error') {
              setSettled(true);
              return true;
            }
          }}
        />
        <View
          accessible={visual.showsErrorChrome}
          importantForAccessibility={
            visual.showsErrorChrome ? 'auto' : 'no-hide-descendants'
          }
          pointerEvents="none"
          style={chromeStyle}
        >
          <AppText
            role={INFRASTRUCTURE_ERROR_TEXT_ROLE}
            style={{
              textAlign: 'center',
              maxWidth: INFRASTRUCTURE_ERROR_COPY_MAX_WIDTH,
            }}
          >
            {INFRASTRUCTURE_ERROR_COPY}
          </AppText>
        </View>
      </View>
      <View
        accessible={visual.showsErrorChrome}
        importantForAccessibility={
          visual.showsErrorChrome ? 'auto' : 'no-hide-descendants'
        }
        pointerEvents={visual.showsErrorChrome ? 'auto' : 'none'}
        style={chromeStyle}
      >
        <SecondaryButton
          label="Повторить"
          onPress={onRetry}
          width="full"
          size="large"
        />
      </View>
    </View>
  );
}
