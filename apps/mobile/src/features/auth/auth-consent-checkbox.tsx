import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';

const CHECK_PATH =
  'M 0 4.172800263061526 L 1.7238869251900724 5.971200591939304 C 2.168333638395593 6.43486729152363 2.3905535379287204 6.6666669845581055 2.666693551201596 6.6666669845581055 C 2.9428335644744714 6.6666669845581055 3.1650601794647013 6.43486729152363 3.6095335558164674 5.971200591939304 L 9.333333969116211 0';

const checkboxSize = designTokens.auth.checkboxSize;
const checkboxRadius = designTokens.auth.checkboxRadius;
const borderWidth = designTokens.auth.checkboxBorderWidth;
const innerRadius = checkboxRadius - borderWidth;

export function AuthConsentCheckbox({
  checked,
  onChange,
  label,
  children,
  error,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  const palette = useAppTheme();
  const toggle = () => {
    if (!disabled) onChange(!checked);
  };
  const borderColors = (
    checked
      ? [palette.solidBorderGradientStart, palette.solidBorderGradientEnd]
      : [palette.outlineBorderGradientStart, palette.outlineBorderGradientEnd]
  ) as [string, string];

  return (
    <View style={{ gap: designTokens.space.fieldErrorGap, width: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: designTokens.auth.titleGap,
        }}
      >
        <MotionPressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked, disabled }}
          accessibilityLabel={label}
          aria-checked={checked}
          disabled={disabled}
          onPress={toggle}
          preset="button"
          hitSlop={12}
        >
          <LinearGradient
            colors={borderColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: checkboxSize,
              height: checkboxSize,
              borderRadius: checkboxRadius,
              padding: borderWidth,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: innerRadius,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: checked ? palette.fieldValue : palette.canvas,
              }}
            >
              {checked ? (
                <Svg width={9.33} height={6.67} viewBox="0 0 9.333334 6.666667">
                  <Path
                    d={CHECK_PATH}
                    stroke={palette.canvas}
                    strokeWidth={1.5}
                    fill="none"
                  />
                </Svg>
              ) : null}
            </View>
          </LinearGradient>
        </MotionPressable>
        <View style={{ flex: 1, gap: designTokens.space.x1, minWidth: 0 }}>
          {children ?? <AppText role="authConsent">{label}</AppText>}
        </View>
      </View>
      {error ? (
        <AppText
          role="bodySmall"
          tone="danger"
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
