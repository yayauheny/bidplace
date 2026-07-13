import type { ComponentPropsWithoutRef } from 'react';
import { ActivityIndicator } from 'react-native';

import { mobileRadius, mobileSpacing, mobileSizes } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Button, Text, XStack } from 'tamagui';

type AppButtonTone = 'primary' | 'secondary' | 'subtle';

type AppButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  isLoading?: boolean;
  loadingLabel?: string;
  tone?: AppButtonTone;
};

function getToneStyles(
  palette: ReturnType<typeof useAppThemePalette>,
  tone: AppButtonTone,
) {
  switch (tone) {
    case 'secondary':
      return {
        backgroundColor: palette.surface,
        borderColor: palette.border,
        color: palette.text,
        pressBackgroundColor: palette.surfaceMuted,
        pressBorderColor: palette.borderStrong,
      };
    case 'subtle':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: palette.text,
        pressBackgroundColor: palette.surfaceMuted,
        pressBorderColor: palette.surfaceMuted,
      };
    case 'primary':
    default:
      return {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
        color: palette.onPrimary,
        pressBackgroundColor: palette.primaryPressed,
        pressBorderColor: palette.primaryPressed,
      };
  }
}

export function AppButton({
  tone = 'primary',
  isLoading,
  loadingLabel,
  disabled,
  children,
  ...props
}: AppButtonProps) {
  const palette = useAppThemePalette();
  const styles = getToneStyles(palette, tone);
  const busy = Boolean(isLoading);
  const isDisabled = Boolean(disabled || busy);
  const indicatorColor = tone === 'primary' ? palette.onPrimary : palette.text;

  return (
    <Button
      disabled={isDisabled}
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: 1,
        borderRadius: mobileRadius.md,
        color: styles.color,
        height: mobileSizes.lg,
        paddingHorizontal: mobileSpacing[4],
        opacity: isDisabled ? 0.55 : 1,
      }}
      focusStyle={{
        borderColor: '$focusRing',
      }}
      {...props}
    >
      {busy ? (
        <XStack
          style={{
            alignItems: 'center',
            gap: mobileSpacing[2],
          }}
        >
          <ActivityIndicator size="small" color={indicatorColor} />
          <Text
            style={{
              color: styles.color,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            {loadingLabel ?? 'Загрузка'}
          </Text>
        </XStack>
      ) : (
        <Text
          style={{
            color: styles.color,
            fontSize: 15,
            fontWeight: '600',
          }}
        >
          {children}
        </Text>
      )}
    </Button>
  );
}
