import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText, SecondaryButton } from '../ui';
import type { SessionAlertProps } from './SessionAlert';

export function SessionAlert({ visible, onRetry }: SessionAlertProps) {
  if (!visible) {
    return null;
  }

  return (
    <View
      accessibilityRole="alert"
      style={{
        width: '100%',
        minHeight: designTokens.size.touch,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: designTokens.space.x3,
        paddingHorizontal: designTokens.space.pageGutter,
        paddingVertical: designTokens.space.x2,
        backgroundColor: designTokens.color.surface,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
      }}
    >
      <AppText role="bodySmall" tone="danger">
        Не удалось проверить сессию
      </AppText>
      <SecondaryButton label="Повторить проверку сессии" onPress={onRetry} />
    </View>
  );
}
