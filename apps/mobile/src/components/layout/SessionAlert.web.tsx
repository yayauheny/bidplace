import { designTokens } from '@bidplace/design-tokens';

import { AppText, SecondaryButton } from '../ui';
import type { SessionAlertProps } from './SessionAlert';

export function SessionAlert({ visible, onRetry }: SessionAlertProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: 'relative',
        zIndex: 0,
        pointerEvents: 'auto',
        boxSizing: 'border-box',
        width: '100%',
        minHeight: designTokens.size.touch,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: designTokens.space.x3,
        paddingLeft: designTokens.space.pageGutter,
        paddingRight: designTokens.space.pageGutter,
        paddingTop: designTokens.space.x2,
        paddingBottom: designTokens.space.x2,
        backgroundColor: designTokens.color.surface,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        borderBottomColor: designTokens.color.border,
      }}
    >
      <AppText role="bodySmall" tone="danger">
        Не удалось проверить сессию
      </AppText>
      <SecondaryButton label="Повторить проверку сессии" onPress={onRetry} />
    </div>
  );
}
