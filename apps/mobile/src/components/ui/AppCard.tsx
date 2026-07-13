import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { YStack } from 'tamagui';

type AppCardProps = {
  children: ReactNode;
} & ComponentPropsWithoutRef<typeof YStack>;

export function AppCard({ children, ...props }: AppCardProps) {
  const palette = useAppThemePalette();

  return (
    <YStack
      gap={mobileSpacing[4]}
      style={{
        padding: mobileSpacing[4],
        borderRadius: mobileRadius.lg,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        shadowColor: palette.shadowColor,
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
      }}
      {...props}
    >
      {children}
    </YStack>
  );
}
