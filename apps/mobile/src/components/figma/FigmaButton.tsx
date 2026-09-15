import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaButtonGradientColors,
  figmaButtonGradientOpacity,
  figmaButtonGradientPlacement,
  figmaButtonLabelColor,
  figmaButtonRadius,
  figmaButtonStyle,
  figmaButtonSurfaceFill,
  figmaButtonUsesGradientBorder,
  figmaButtonUsesOutsidePaintWrapper,
  type FigmaButtonInteraction,
  type FigmaButtonSize,
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
  size = 'regular',
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
  size?: FigmaButtonSize;
}) {
  const inactive = disabled || loading;
  const textColor = figmaButtonLabelColor(variant);
  const radius = figmaButtonRadius(size);
  const compact = size === 'compact';
  const gradientPlacement = figmaButtonGradientPlacement(variant);
  const alignSelf = width === 'full' ? 'stretch' : 'flex-start';

  const button = (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      preset="primaryAction"
      hitSlop={
        compact
          ? {
              top: figmaTokens.space.quietButtonY,
              bottom: figmaTokens.space.quietButtonY,
              left: figmaTokens.space.quietButtonX,
              right: figmaTokens.space.quietButtonX,
            }
          : undefined
      }
      style={({ hovered, pressed }) => [
        {
          position: 'relative',
          alignSelf,
        },
        figmaButtonStyle(
          variant,
          resolveInteraction({ inactive, hovered, pressed }),
          size,
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
            {figmaButtonUsesGradientBorder(variant) &&
            gradientPlacement === 'inset' ? (
              <>
                <LinearGradient
                  pointerEvents="none"
                  colors={[...figmaButtonGradientColors(variant)]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[
                    styles.gradientBorder,
                    {
                      borderRadius: radius,
                      opacity: figmaButtonGradientOpacity(variant),
                    },
                  ]}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.gradientSurface,
                    {
                      borderRadius: radius,
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
                gap: icon
                  ? compact
                    ? figmaTokens.space.quietButtonGap
                    : figmaTokens.space.x2
                  : 0,
                opacity: loading ? 0 : 1,
              }}
            >
              {iconPosition === 'left' ? iconElement : null}
              <AppText
                role={compact ? 'buttonCompact' : 'button'}
                style={{ color: textColor }}
              >
                {label}
              </AppText>
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

  if (!figmaButtonUsesOutsidePaintWrapper(variant)) {
    return button;
  }

  return (
    <View style={[styles.outsideWrapper, { alignSelf }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[...figmaButtonGradientColors(variant)]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.outsideStroke,
          {
            borderRadius: radius + 1,
            opacity: figmaButtonGradientOpacity(variant),
          },
        ]}
      />
      {button}
    </View>
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
  outsideWrapper: {
    position: 'relative',
  },
  outsideStroke: {
    position: 'absolute',
    top: -1,
    right: -1,
    bottom: -1,
    left: -1,
  },
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
