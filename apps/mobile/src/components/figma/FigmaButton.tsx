import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import {
  figmaButtonContentHeight,
  figmaButtonHitSlop,
  figmaButtonTokens,
  figmaTokens,
  resolveFigmaButtonInteraction,
} from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaIcon } from './FigmaIcon';
import { type FigmaIconName } from './figma-icon-names';
import {
  figmaButtonLabelColor,
  figmaButtonOverlayColor,
  figmaButtonPressedGhostInset,
  figmaButtonSurfaceFill,
  figmaButtonStyle,
  type FigmaButtonVariant,
} from './figma-button-style';
import { FigmaButtonGradientStroke } from './FigmaButtonGradientStroke';

type FigmaButtonBaseProps = {
  label: string;
  variant?: FigmaButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  iconNode?: ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityHint?: string;
  width?: 'content' | 'full';
  testID?: string;
};

type FigmaButtonPressProps = FigmaButtonBaseProps & {
  href?: undefined;
  onPress: () => void;
};

type FigmaButtonLinkProps = FigmaButtonBaseProps & {
  href: Href;
  onPress?: () => void;
};

export type FigmaButtonProps = FigmaButtonPressProps | FigmaButtonLinkProps;

export function FigmaButton(props: FigmaButtonPressProps | FigmaButtonLinkProps) {
  const {
    label,
    variant = 'solid',
    disabled = false,
    loading = false,
    icon,
    iconNode,
    iconPosition = 'left',
    accessibilityHint,
    width = 'content',
    testID,
  } = props;
  const inactive = disabled || loading;
  const textColor = figmaButtonLabelColor(variant);
  const alignSelf = width === 'full' ? 'stretch' : 'flex-start';
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setLayout((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
  };

  const contentHeight = figmaButtonContentHeight();
  const hitSlop = figmaButtonHitSlop({
    width: layout.width > 0 ? layout.width : undefined,
    height: layout.height > 0 ? layout.height : contentHeight,
  });
  const ghostInsetMetrics = figmaButtonTokens.metrics.strokeWidth;

  const pressable = (
    <MotionPressable
      testID={testID}
      accessibilityRole={props.href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={props.href ? undefined : props.onPress}
      preset="primaryAction"
      opacityFeedback="component"
      hitSlop={hitSlop}
      onLayout={onLayout}
      style={({ hovered, pressed }) => {
        const interaction = resolveFigmaButtonInteraction({
          inactive,
          hovered,
          pressed,
        });
        return [
          {
            position: 'relative',
            alignSelf,
          },
          figmaButtonStyle(variant, interaction),
        ];
      }}
    >
      {({ hovered, pressed }) => {
        const interaction = resolveFigmaButtonInteraction({
          inactive,
          hovered,
          pressed,
        });
        const overlay = figmaButtonOverlayColor(variant, interaction);
        const ghostInset = figmaButtonPressedGhostInset(variant, interaction);
        const surfaceFill = figmaButtonSurfaceFill(variant, interaction);
        const { borderRadius } = figmaButtonStyle(variant, interaction);
        const insetBoxStyle = ghostInset
          ? {
              position: 'absolute' as const,
              top: ghostInsetMetrics,
              left: ghostInsetMetrics,
              right: ghostInsetMetrics,
              bottom: ghostInsetMetrics,
              borderRadius,
            }
          : null;
        const iconElement = icon ? (
          <View style={styles.iconFrame}>
            <FigmaIcon name={icon} color={textColor} />
          </View>
        ) : null;

        return (
          <>
            {ghostInset ? (
              <View
                pointerEvents="none"
                style={[insetBoxStyle, { backgroundColor: surfaceFill }]}
              />
            ) : null}
            <FigmaButtonGradientStroke
              variant={variant}
              interaction={interaction}
              borderRadius={borderRadius}
              width={layout.width}
              height={layout.height}
            />
            {overlay ? (
              <View
                pointerEvents="none"
                style={[
                  ghostInset ? insetBoxStyle : StyleSheet.absoluteFill,
                  { backgroundColor: overlay, borderRadius },
                ]}
              />
            ) : null}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: iconNode || icon ? figmaTokens.space.x2 : 0,
                opacity: loading ? 0 : 1,
              }}
            >
              {iconNode ?? (iconPosition === 'left' ? iconElement : null)}
              <AppText
                role="button"
                style={{
                  color: textColor,
                  ...figmaButtonTokens.typography,
                }}
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

  if (props.href) {
    return (
      <Link href={props.href} asChild>
        {pressable}
      </Link>
    );
  }

  return pressable;
}

const styles = StyleSheet.create({
  iconFrame: {
    width: figmaTokens.size.buttonIconFrame,
    height: figmaTokens.size.buttonIconFrame,
    padding: figmaTokens.space.buttonIconPad,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
