import type { ReactNode } from 'react';

import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';

export function ModerationCard({
  title,
  status,
  reviewStatus,
  legacy = false,
  children,
}: {
  title: string;
  status: string;
  reviewStatus?: string | null;
  legacy?: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        gap: designTokens.space.x2,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.color.border,
        paddingBottom: designTokens.space.x4,
      }}
    >
      <AppText role="label">{title}</AppText>
      <AppText role="bodySmall" tone="secondary">
        Публикация: {status}
      </AppText>
      {legacy ? (
        <AppText role="bodySmall" tone="secondary">
          Профиль без ревизии
        </AppText>
      ) : null}
      {reviewStatus ? (
        <AppText role="bodySmall" tone="secondary">
          Проверка: {reviewStatus}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

