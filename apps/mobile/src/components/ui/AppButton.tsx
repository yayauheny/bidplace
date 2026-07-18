import type { ComponentPropsWithoutRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, Text, XStack } from 'tamagui';

import { mobileRadius, mobileSpacing, mobileSizes } from '../../theme/tokens';
import { useAppThemePalette } from '../../theme/palette';

type ButtonTone = 'primary' | 'secondary' | 'subtle' | 'danger';
type ButtonSize = 'small' | 'default' | 'large';

type AppButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  isLoading?: boolean;
  loadingLabel?: string;
  tone?: ButtonTone;
  buttonSize?: ButtonSize;
};

function getToneStyles(
  palette: ReturnType<typeof useAppThemePalette>,
  tone: ButtonTone,
) {
  switch (tone) {
    case 'secondary':
      return {
        backgroundColor: palette.surface,
        borderColor: palette.borderColor,
        color: palette.color,
      };
    case 'subtle':
      return {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: palette.color,
      };
    case 'danger':
      return {
        backgroundColor: palette.negativeTint,
        borderColor: palette.negative,
        color: palette.negative,
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
  const indicatorColor = tone === 'primary' ? palette.onPrimary : palette.color;

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

  const fontSize = buttonSize === 'large' ? 15 : 14;

  return (
    <Button
      disabled={isDisabled}
      style={{
        backgroundColor: styles.backgroundColor,
        borderColor: styles.borderColor,
        borderWidth: 1,
        borderRadius: mobileRadius.control,
        height,
        paddingHorizontal,
        minWidth: mobileSizes.touch,
        opacity: isDisabled ? 0.5 : 1,
      }}
      focusStyle={{
        outlineColor: palette.focusRing,
        outlineWidth: 2,
        outlineOffset: 2,
      }}
      {...props}
    >
      {busy ? (
        <XStack style={{ alignItems: 'center', gap: mobileSpacing[2] }}>
          <ActivityIndicator size="small" color={indicatorColor} />
          <Text
            style={{
              color: styles.color,
              fontSize,
              fontWeight: '600',
              letterSpacing: 0.1,
            }}
          >
            {loadingLabel ?? 'Загрузка'}
          </Text>
        </XStack>
      ) : (
        <Text
          style={{
            color: styles.color,
            fontSize,
            fontWeight: '600',
            letterSpacing: 0.1,
          }}
        >
          {children}
        </Text>
      )}
    </Button>
  );
}
