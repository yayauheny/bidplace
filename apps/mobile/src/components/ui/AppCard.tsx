// Surface — generic elevated surface primitive.
// Use for auth cards, info sections, and any elevated container.
// Responsibility: background + border + padding. No business logic.
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { YStack } from 'tamagui';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type SurfaceProps = {
  children: ReactNode;
  noPadding?: boolean;
} & ComponentPropsWithoutRef<typeof YStack>;

export function Surface({ children, noPadding, ...props }: SurfaceProps) {
  const palette = useAppThemePalette();

  return (
    <YStack
      {...props}
      style={[
        {
          backgroundColor: palette.surface,
          borderRadius: mobileRadius.panel,
          borderWidth: 1,
          borderColor: palette.borderColor,
          padding: noPadding ? 0 : mobileSpacing[4],
        },
        props.style,
      ]}
    >
      {children}
    </YStack>
  );
}

// AppCard is preserved as an alias during migration.
export { Surface as AppCard };
