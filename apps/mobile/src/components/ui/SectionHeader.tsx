import type { ReactNode } from 'react';

import { mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { AppButton } from './AppButton';
import { Text, XStack, YStack } from 'tamagui';

type SectionHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function SectionHeader({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: SectionHeaderProps) {
  const palette = useAppThemePalette();

  return (
    <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: mobileSpacing[3] }}>
      <YStack style={{ flex: 1, gap: mobileSpacing[1] }}>
        <Text style={{ color: palette.text, fontSize: 20, lineHeight: 26, fontWeight: '700' }}>
          {title}
        </Text>
        {description ? (
          <Text style={{ color: palette.textMuted, fontSize: 14, lineHeight: 20 }}>
            {description}
          </Text>
        ) : null}
      </YStack>
      {actionLabel && onAction ? (
        <AppButton tone="subtle" onPress={onAction}>
          {actionLabel}
        </AppButton>
      ) : null}
      {children}
    </XStack>
  );
}
