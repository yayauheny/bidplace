import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

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
  if (getPageStateMode({ loading, retry: Boolean(retry) }) === 'loading') {
    return (
      <View
        style={{
          minHeight: 220,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: modernTokens.space.x8,
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
      style={{
        minHeight: 220,
        alignItems: 'center',
        justifyContent: 'center',
        gap: modernTokens.space.x3,
        paddingVertical: modernTokens.space.x8,
      }}
    >
      <AppText role="sectionTitle">{title}</AppText>
      {message ? (
        <AppText role="bodySmall" tone="secondary" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {retry ? <PrimaryButton label="Повторить" onPress={retry} /> : null}
    </View>
  );
}
