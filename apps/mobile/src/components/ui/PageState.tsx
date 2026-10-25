import { View } from 'react-native';
import { FigmaIcon } from '../figma/FigmaIcon';
import { useAppTheme } from '../../providers/theme-provider';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';
import { PrimaryButton } from './Button';
import { getPageStateMode } from './page-state-contract';

// Figma 7245:2983–2993: optical center is 20.1px above the viewport midpoint.
const searchEmptyLayout = {
  maxWidth: 306,
  iconInset: 10.4,
  gap: 10,
  textGap: 7,
  centerOffset: 20.1,
};

export function PageState({
  title,
  message,
  loading = false,
  retry,
  variant = 'default',
}: {
  title: string;
  variant?: 'default' | 'search';
  message?: string;
  loading?: boolean;
  retry?: () => void;
}) {
  const palette = useAppTheme();
  const mode = getPageStateMode({ loading, retry: Boolean(retry) });

  if (mode === 'loading') {
    return (
      <View
        style={{
          minHeight: 220,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: designTokens.space.x8,
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

  if (variant === 'search' && mode === 'empty') {
    return (
      <View
        testID="search-empty-state"
        accessibilityLiveRegion="polite"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: designTokens.space.x8,
          paddingBottom:
            designTokens.space.x8 + 2 * searchEmptyLayout.centerOffset,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: searchEmptyLayout.maxWidth,
            alignItems: 'center',
            gap: searchEmptyLayout.gap,
          }}
        >
          <View style={{ padding: searchEmptyLayout.iconInset }}>
            <FigmaIcon name="search-01" size={designTokens.size.dockIcon} />
          </View>
          <View style={{ width: '100%', gap: searchEmptyLayout.textGap }}>
            <AppText role="emptyStateTitle" style={{ textAlign: 'center' }}>
              {title}
            </AppText>
            <AppText
              role="emptyStateBody"
              style={{ textAlign: 'center', color: palette.fieldIcon }}
            >
              {message}
            </AppText>
          </View>
        </View>
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
      }}
    >
      <AppText role="sectionTitle" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText role="bodySmall" tone="secondary" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {retry ? (
        <PrimaryButton label="Повторить" onPress={retry} alignSelf="center" />
      ) : null}
    </View>
  );
}
