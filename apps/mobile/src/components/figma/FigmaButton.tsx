import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

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
  figmaButtonStyle,
  type FigmaButtonInteraction,
  type FigmaButtonVariant,
} from './figma-button-style';
import { FigmaButtonSurface } from './FigmaButtonSurface';
import { useCssBorderBox } from './use-css-border-box';

type FigmaButtonVisualContentProps = {
  variant: FigmaButtonVariant;
  interaction: FigmaButtonInteraction;
  label: string;
  layout: { width: number; height: number };
  loading?: boolean;
  icon?: FigmaIconName;
  iconNode?: ReactNode;
  iconPosition?: 'left' | 'right';
  presentational?: boolean;
};

function FigmaButtonVisualContent({
  variant,
  interaction,
  label,
  layout,
  loading = false,
  icon,
  iconNode,
  iconPosition = 'left',
  presentational = false,
}: FigmaButtonVisualContentProps) {
  const textColor = figmaButtonLabelColor(variant);
  const iconElement = icon ? (
    <View style={styles.iconFrame}>
      <FigmaIcon name={icon} color={textColor} />
    </View>
  ) : null;

  return (
    <>
      <FigmaButtonSurface
        variant={variant}
        interaction={interaction}
        width={layout.width}
        height={layout.height}
      />
      <View
        importantForAccessibility={presentational ? 'no-hide-descendants' : undefined}
        accessibilityElementsHidden={presentational ? true : undefined}
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
          role={presentational ? 'body' : 'button'}
          importantForAccessibility={presentational ? 'no' : undefined}
          accessibilityElementsHidden={presentational ? true : undefined}
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
}

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

export type FigmaButtonStatePreviewProps = {
  variant: FigmaButtonVariant;
  interaction: FigmaButtonInteraction;
  label?: string;
  testID?: string;
  accessibilityLabel: string;
};

export function FigmaButtonStatePreview({
  variant,
  interaction,
  label = figmaButtonTokens.metrics.sampleLabel,
  testID,
  accessibilityLabel,
}: FigmaButtonStatePreviewProps) {
  const { layout, onLayout } = useCssBorderBox();
  const resolvedTestID =
    testID ?? `figma-button-preview-${variant}-${interaction}`;

  const shellStyle = figmaButtonStyle(variant, interaction);

  return (
    <View
      testID={resolvedTestID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
      onLayout={onLayout}
      style={{
        position: 'relative',
        alignSelf: 'flex-start',
        ...shellStyle,
      }}
    >
      <FigmaButtonVisualContent
        variant={variant}
        interaction={interaction}
        label={label}
        layout={layout}
        presentational
      />
    </View>
  );
}

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
  const alignSelf = width === 'full' ? 'stretch' : 'flex-start';
  const { layout, onLayout } = useCssBorderBox();

  const contentHeight = figmaButtonContentHeight();
  const hitSlop = figmaButtonHitSlop({
    width: layout.width > 0 ? layout.width : undefined,
    height: layout.height > 0 ? layout.height : contentHeight,
  });

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
      style={{
        position: 'relative',
        alignSelf,
      }}
      interactionStyle={({ hovered, pressed }) => {
        const interaction = resolveFigmaButtonInteraction({
          inactive,
          hovered,
          pressed,
        });
        return figmaButtonStyle(variant, interaction);
      }}
    >
      {({ hovered, pressed }) => {
        const interaction = resolveFigmaButtonInteraction({
          inactive,
          hovered,
          pressed,
        });

        return (
          <FigmaButtonVisualContent
            variant={variant}
            interaction={interaction}
            label={label}
            layout={layout}
            loading={loading}
            icon={icon}
            iconNode={iconNode}
            iconPosition={iconPosition}
          />
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
