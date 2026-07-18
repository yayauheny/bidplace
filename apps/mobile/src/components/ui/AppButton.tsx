import type { ComponentPropsWithoutRef } from 'react';
import { ActivityIndicator } from 'react-native';

import { mobileRadius, mobileSpacing, mobileSizes } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';
import { Button, Text, XStack } from 'tamagui';

type AppButtonTone = 'primary' | 'secondary' | 'subtle';
type AppButtonSize = 'small' | 'default' | 'large';

type AppButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  isLoading?: boolean;
  loadingLabel?: string;
  tone?: AppButtonTone;
  buttonSize?: AppButtonSize;
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
      };
    case 'subtle':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: palette.text,
      };
    case 'primary':
    default:
      return {
        backgroundColor: palette.primary,
        borderColor: palette.primary,
        color: palette.onPrimary,
      };
  }
}

export function AppButton({
  tone = 'primary',
  buttonSize = 'default',
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
  const height =
    buttonSize === 'large'
      ? mobileSizes['2xl']
      : buttonSize === 'small'
        ? mobileSizes.md
        : mobileSizes.lg;
  const paddingHorizontal =
    buttonSize === 'large'
      ? mobileSpacing[6]
      : buttonSize === 'small'
        ? mobileSpacing[3]
        : mobileSpacing[4];
  const radius = buttonSize === 'large' ? mobileRadius.lg : mobileRadius.md;

  return (
    <Button
      disabled={isDisabled}
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: 1,
        borderRadius: radius,
        color: styles.color,
        height,
        paddingHorizontal,
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
              fontSize: buttonSize === 'large' ? 16 : 14,
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
            fontSize: buttonSize === 'large' ? 16 : 14,
            fontWeight: '600',
            letterSpacing: 0.2,
          }}
        >
          {children}
        </Text>
      )}
    </Button>
  );
}
