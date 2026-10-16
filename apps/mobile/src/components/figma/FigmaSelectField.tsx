import { forwardRef, useId, useState, type ComponentRef } from 'react';
import { Platform, Text, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { useAppTheme } from '../../providers/theme-provider';
import { MotionPressable } from '../ui/MotionPressable';
import {
  figmaFieldPlaceholderColor,
  figmaFieldShowsFloatingLabel,
  figmaFieldStatus,
  figmaFieldStyle,
  figmaFieldValueColor,
  type FigmaFieldVariant,
} from './figma-text-field-style';

export const FigmaSelectField = forwardRef<
  ComponentRef<typeof MotionPressable>,
  {
    label: string;
    placeholder: string;
    value: string;
    error?: string;
    disabled?: boolean;
    onPress: () => void;
    variant?: FigmaFieldVariant;
  }
>(function FigmaSelectField(
  {
    label,
    placeholder,
    value,
    error,
    disabled = false,
    onPress,
    variant = 'default',
  },
  ref,
) {
  const palette = useAppTheme();
  const errorId = useId();
  const valueId = useId();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const filled = value.length > 0;
  const status = figmaFieldStatus({
    disabled,
    error: Boolean(error),
    success: false,
    focused,
    hovered,
    filled: filled || focused,
  });
  const showLabel = figmaFieldShowsFloatingLabel(status);
  const valueColor = figmaFieldValueColor(status, palette);
  const displayText = filled ? value : placeholder;
  const displayIsPlaceholder = !filled && !focused;

  const field = (
    <View style={{ width: '100%' }}>
      <MotionPressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={error ? `Ошибка: ${error}` : undefined}
        accessibilityState={{ disabled }}
        accessibilityValue={{ text: value }}
        disabled={disabled}
        onPress={onPress}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        preset="button"
        {...(Platform.OS === 'web'
          ? ({
              'aria-invalid': error ? true : undefined,
              'aria-describedby':
                [value ? valueId : '', error ? errorId : '']
                  .filter(Boolean)
                  .join(' ') || undefined,
              'aria-haspopup': 'dialog',
            } as object)
          : {})}
        style={figmaFieldStyle(status, false, 'default', variant, palette)}
      >
        <Text
          nativeID={valueId}
          numberOfLines={1}
          importantForAccessibility="no"
          accessibilityElementsHidden
          style={{
            flex: 1,
            minWidth: 0,
            color: displayIsPlaceholder
              ? figmaFieldPlaceholderColor(status, variant, palette)
              : valueColor,
            ...designTokens.typography.field,
          }}
        >
          {displayText}
        </Text>
        {/* shortcut: label stays mounted with display none — unmounting it during blur re-triggers the radix FocusScope mutation observer and steals focus to the dialog container */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: designTokens.space.fieldLabelX,
            top: designTokens.space.fieldLabelY,
            paddingHorizontal: 4,
            backgroundColor: palette.canvas,
            display: showLabel ? undefined : 'none',
          }}
        >
          <Text
            style={{
              color: palette.fieldLabel,
              ...designTokens.typography.fieldLabel,
            }}
          >
            {label}
          </Text>
        </View>
      </MotionPressable>
      {error ? (
        <Text
          nativeID={errorId}
          accessibilityLiveRegion="polite"
          style={{
            marginTop: designTokens.space.fieldErrorGap,
            marginLeft: designTokens.space.fieldErrorX,
            marginRight: designTokens.space.fieldX,
            color: palette.error,
            ...designTokens.typography.fieldError,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );

  if (Platform.OS !== 'web') {
    return field;
  }

  return (
    <View
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {field}
    </View>
  );
});
