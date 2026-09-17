import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { INFRASTRUCTURE_ERROR_COPY } from '../../errors';
import { AppText } from './AppText';
import { PrimaryButton } from './Button';
import { getPageStateMode } from './page-state-contract';

export function PageState({
  title,
  message,
  loading = false,
  retry,
}: {
  title: string;
  message?: string;
  loading?: boolean;
  retry?: () => void;
}) {
  const mode = getPageStateMode({ loading, retry: Boolean(retry) });

  if (mode === 'loading') {
    return (
      <View
        style={{
          minHeight: 220,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: designTokens.space.x8,
          paddingHorizontal: designTokens.space.pageGutter,
        }}
      >
        <AppText
          role="sectionTitle"
          accessibilityRole="progressbar"
          accessibilityLiveRegion="polite"
        >
          {title}
        </AppText>
      </View>
    );
  }

  return (
    <View
      accessibilityRole={mode === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={mode === 'error' ? 'polite' : 'none'}
      style={{
        minHeight: 220,
        alignItems: 'center',
        justifyContent: 'center',
        gap: designTokens.space.x3,
        paddingVertical: designTokens.space.x8,
        paddingHorizontal: designTokens.space.pageGutter,
      }}
    >
      <AppText role="sectionTitle" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message || mode === 'error' ? (
        <AppText role="bodySmall" tone="secondary" style={{ textAlign: 'center' }}>
          {message ?? INFRASTRUCTURE_ERROR_COPY}
        </AppText>
      ) : null}
      {retry ? (
        <PrimaryButton label="Повторить" onPress={retry} alignSelf="center" />
      ) : null}
    </View>
  );
}
