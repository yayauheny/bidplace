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
        borderRadius: mobileRadius.md,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.surface,
        shadowColor: palette.shadowColor,
        shadowOpacity: 0.04,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      }}
      {...props}
    >
      {children}
    </YStack>
  );
}
