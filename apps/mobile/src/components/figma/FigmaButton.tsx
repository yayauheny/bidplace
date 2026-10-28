import { Link, type Href } from 'expo-router';
import type { ElementRef, ReactNode, Ref } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  figmaButtonContentGap,
  figmaButtonContentHeight,
  figmaButtonHitSlop,
  figmaButtonSizeMetrics,
  figmaButtonTokens,
  designTokens,
  resolveFigmaButtonInteraction,
  type FigmaButtonSize,
} from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { useAppTheme } from '../../providers/theme-provider';
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

type FigmaButtonContentAlign = 'center' | 'navigation';

type FigmaButtonVisualContentProps = {
  variant: FigmaButtonVariant;
  interaction: FigmaButtonInteraction;
  label: string;
  layout: { width: number; height: number };
  size?: FigmaButtonSize;
  contentAlign?: FigmaButtonContentAlign;
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
  size = 'matrix',
  contentAlign = 'center',
  loading = false,
  icon,
  iconNode,
  iconPosition = 'left',
  presentational = false,
}: FigmaButtonVisualContentProps) {
  const palette = useAppTheme();
  const textColor = figmaButtonLabelColor(variant, size, palette);
  const navigation = contentAlign === 'navigation';
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
        importantForAccessibility={
          presentational ? 'no-hide-descendants' : undefined
        }
        accessibilityElementsHidden={presentational ? true : undefined}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: navigation ? 'space-between' : 'center',
          alignSelf: navigation ? 'stretch' : undefined,
          width: navigation ? '100%' : undefined,
          gap: iconNode || icon ? figmaButtonContentGap(size) : 0,
          opacity: loading ? 0 : 1,
        }}
      >
        {iconNode ?? (iconPosition === 'left' ? iconElement : null)}
        <AppText
          role={presentational ? 'body' : 'button'}
          importantForAccessibility={presentational ? 'no' : undefined}
          accessibilityElementsHidden={presentational ? true : undefined}
          style={{
            flex: navigation ? 1 : undefined,
            minWidth: navigation ? 0 : undefined,
            textAlign: navigation ? 'left' : 'center',
            color: textColor,
            ...figmaButtonSizeMetrics(size).typography,
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
  ref?: Ref<ElementRef<typeof MotionPressable>>;
  label: string;
  variant?: FigmaButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: FigmaIconName;
  iconNode?: ReactNode;
  iconPosition?: 'left' | 'right';
  accessibilityHint?: string;
  accessibilityCurrent?: 'page';
  width?: 'content' | 'full';
  size?: FigmaButtonSize;
  contentAlign?: FigmaButtonContentAlign;
  testID?: string;
};

type FigmaButtonPressAction = {
  href?: never;
  onPress: () => void;
};

type FigmaButtonNavigationAction = {
  href: Href;
  onPress?: never;
};

type FigmaButtonPressProps = FigmaButtonBaseProps & FigmaButtonPressAction;

type FigmaButtonLinkProps = FigmaButtonBaseProps & FigmaButtonNavigationAction;

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
  const palette = useAppTheme();
  const { layout, onLayout } = useCssBorderBox();
  const resolvedTestID =
    testID ?? `figma-button-preview-${variant}-${interaction}`;

  const shellStyle = figmaButtonStyle(variant, interaction, 'matrix', palette);

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

export function FigmaButton(
  props: FigmaButtonPressProps | FigmaButtonLinkProps,
) {
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
    size = 'matrix',
    contentAlign = 'center',
    testID,
  } = props;
  const inactive = disabled || loading;
  const alignSelf = width === 'full' ? 'stretch' : 'flex-start';
  const palette = useAppTheme();
  const { layout, onLayout } = useCssBorderBox();

  const contentHeight = figmaButtonContentHeight(size);
  const hitSlop = figmaButtonHitSlop({
    width: layout.width > 0 ? layout.width : undefined,
    height: layout.height > 0 ? layout.height : contentHeight,
  });

  const pressable = (
    <MotionPressable
      ref={props.ref}
      testID={testID}
      accessibilityRole={props.href ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      {...{ 'aria-current': props.accessibilityCurrent }}
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
        return figmaButtonStyle(variant, interaction, size, palette);
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
            size={size}
            contentAlign={contentAlign}
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
    width: designTokens.size.buttonIconFrame,
    height: designTokens.size.buttonIconFrame,
    padding: designTokens.space.buttonIconPad,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
