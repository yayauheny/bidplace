import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaButtonLabelColor,
  figmaButtonStyle,
  figmaButtonSurfaceFill,
  figmaButtonUsesGradientBorder,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
} from './figma-button-style';

export function FigmaButton({
  label,
  onPress,
  variant = 'solid',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  accessibilityHint,
  width = 'content',
}: {
  label: string;
  onPress: () => void;
  variant?: FigmaButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  iconPosition?: 'left' | 'right';
  accessibilityHint?: string;
  width?: 'content' | 'full';
}) {
  const inactive = disabled || loading;
  const textColor = figmaButtonLabelColor(variant);

  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      preset="primaryAction"
      style={({ hovered, pressed }) => [
        {
          position: 'relative',
          alignSelf: width === 'full' ? 'stretch' : 'flex-start',
        },
        figmaButtonStyle(
          variant,
          resolveInteraction({ inactive, hovered, pressed }),
        ),
      ]}
    >
      {({ hovered, pressed }) => {
        const interaction = resolveInteraction({ inactive, hovered, pressed });
        const iconElement = icon ? (
          <View style={styles.iconFrame}>
            <FigmaIcon name={icon} color={textColor} />
          </View>
        ) : null;

        return (
          <>
            {figmaButtonUsesGradientBorder(variant) ? (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={[figmaTokens.color.ink, '#585858']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.gradientBorder}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.gradientSurface,
                    {
                      backgroundColor: figmaButtonSurfaceFill(
                        variant,
                        interaction,
                      ),
                    },
                  ]}
                />
              </>
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: icon ? 2 : 0,
                opacity: loading ? 0 : 1,
              }}
            >
              {iconPosition === 'left' ? iconElement : null}
              <Text
                style={[{ color: textColor }, figmaTokens.typography.button]}
              >
                {label}
              </Text>
              {iconPosition === 'right' ? iconElement : null}
            </View>
            {loading ? (
              <ActivityIndicator
                color={textColor}
                size="small"
                style={{ position: 'absolute' }}
              />
            ) : null}
          </>
        );
      }}
    </MotionPressable>
  );
}

function resolveInteraction({
  inactive,
  hovered,
  pressed,
}: {
  inactive: boolean;
  hovered: boolean;
  pressed: boolean;
}): FigmaButtonInteraction {
  if (inactive) return 'disabled';
  if (pressed) return 'pressed';
  if (hovered) return 'hover';
  return 'idle';
}

const styles = StyleSheet.create({
  gradientBorder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: figmaTokens.radius.button,
  },
  gradientSurface: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 1,
    borderRadius: figmaTokens.radius.button,
  },
  iconFrame: {
    width: figmaTokens.size.buttonIconFrame,
    height: figmaTokens.size.buttonIconFrame,
    padding: figmaTokens.space.buttonIconPad,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
