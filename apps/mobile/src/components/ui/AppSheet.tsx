import type { ReactNode } from 'react';

import { mobileRadius, mobileSpacing } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Sheet, Text, YStack } from 'tamagui';

type AppSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  snapPoints?: number[];
};

export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  snapPoints = [85],
}: AppSheetProps) {
  const palette = useAppThemePalette();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay style={{ backgroundColor: palette.overlay }} />
      <Sheet.Frame
        style={{
          backgroundColor: palette.surface,
          padding: mobileSpacing[5],
          gap: mobileSpacing[4],
          borderTopLeftRadius: mobileRadius.large,
          borderTopRightRadius: mobileRadius.large,
        }}
      >
        <Sheet.Handle />
        {title || description ? (
          <YStack gap={mobileSpacing[1]}>
            {title ? (
              <Text
                style={{
                  color: palette.color,
                  fontSize: 20,
                  lineHeight: 26,
                  fontWeight: '700',
                }}
              >
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text
                style={{
                  color: palette.colorMuted,
                  fontSize: 14,
                  lineHeight: 20,
                }}
              >
                {description}
              </Text>
            ) : null}
          </YStack>
        ) : null}
        {children}
      </Sheet.Frame>
    </Sheet>
  );
}
