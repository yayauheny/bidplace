import type { MutableRefObject } from 'react';
import { TextInput, View } from 'react-native';
import { AppIcon, MotionPressable } from '../ui';

import { designTokens } from '@bidplace/design-tokens';

import {
  assignFocusableAnchorRef,
  type FocusableAnchor,
} from './focusable-anchor';
import {
  mobileActionRadius,
  mobileActionSize,
  mobileControlBorderColor,
  mobileHeaderHorizontalGap,
  mobileSearchOpenBorderColor,
  mobileSearchOpenPaddingHorizontalOffset,
} from './mobile-header-layout';

export function MobileSearchTrigger({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Поиск"
      onPress={onPress}
      preset="icon"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        borderWidth: 1,
        borderColor: mobileControlBorderColor,
        backgroundColor: designTokens.color.headerControl,
      }}
    >
      <AppIcon name="search" size={20} />
    </MotionPressable>
  );
}

export function MobileCreateTrigger({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <MotionPressable
      accessibilityRole="button"
      accessibilityLabel="Создать"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      preset="primaryAction"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        backgroundColor: designTokens.color.action,
      }}
    >
      <AppIcon name="plus" size={20} color={designTokens.color.surface} />
    </MotionPressable>
  );
}

export function MobileMenuTrigger({
  onPress,
  open,
  triggerRef,
}: {
  onPress: () => void;
  open: boolean;
  triggerRef: MutableRefObject<FocusableAnchor | null>;
}) {
  return (
    <MotionPressable
      ref={(node) => assignFocusableAnchorRef(triggerRef, node)}
      nativeID="mobile-menu-trigger"
      accessibilityRole="button"
      accessibilityLabel="Меню"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      preset="icon"
      style={{
        width: mobileActionSize,
        height: mobileActionSize,
        minWidth: mobileActionSize,
        minHeight: mobileActionSize,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: mobileActionRadius,
        borderWidth: 1,
        borderColor: mobileControlBorderColor,
        backgroundColor: designTokens.color.headerControl,
      }}
    >
      <AppIcon name="menu" size={20} />
    </MotionPressable>
  );
}

export function MobileSearchOpen({
  value,
  onChangeText,
  onBack,
  onSubmit,
  inputRef,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  inputRef: MutableRefObject<TextInput>;
  placeholder: string;
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: mobileHeaderHorizontalGap }}>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel="Закрыть поиск"
        onPress={onBack}
        preset="icon"
        style={{
          width: mobileActionSize,
          height: mobileActionSize,
          minWidth: mobileActionSize,
          minHeight: mobileActionSize,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: mobileActionRadius,
        }}
      >
        <AppIcon name="arrowLeft" size={20} />
      </MotionPressable>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          height: designTokens.size.input,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: designTokens.size.input / 2,
          borderWidth: 1,
          borderColor: mobileSearchOpenBorderColor,
          backgroundColor: designTokens.color.headerControl,
          paddingHorizontal:
            designTokens.space.x4 + mobileSearchOpenPaddingHorizontalOffset,
        }}
      >
        <AppIcon
          name="search"
          size={20}
          color={designTokens.color.textSecondary}
        />
        <TextInput
          ref={(node) => {
            inputRef.current = node as TextInput;
          }}
          accessibilityLabel="Найти предмет или автора"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={designTokens.color.textMuted}
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            color: designTokens.color.ink,
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
          }}
        />
      </View>
    </View>
  );
}

