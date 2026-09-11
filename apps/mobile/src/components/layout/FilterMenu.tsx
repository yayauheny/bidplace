import { useId, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppIcon, AppText, MotionPressable } from '../ui';
import {
  assignFocusableAnchorRef,
  type FocusableAnchor,
} from './focusable-anchor';
import { useDismissibleOverlay } from './use-dismissible-overlay';
import { OverlayPortal } from './OverlayHost';

type FilterMenuOption = { value: string; label: string };

export function FilterMenu({
  variant,
  label,
  value,
  options,
  onSelect,
  allLabel,
  dismissOnOutside = true,
  dropdownMinWidth,
  dropdownAlign = 'left',
}: {
  variant: 'facet' | 'sort';
  label: string;
  value?: string;
  options: FilterMenuOption[];
  onSelect: (value?: string) => void;
  allLabel?: string;
  dismissOnOutside?: boolean;
  dropdownMinWidth?: number;
  dropdownAlign?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<FocusableAnchor | null>(null);
  const menuId = `filter-menu-${variant}-${useId()}`;
  const panelId = `${menuId}-panel`;

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? null;

  const dismissEnabled = dismissOnOutside && open;

  useDismissibleOverlay({
    open: dismissEnabled,
    onClose: () => setOpen(false),
    restoreFocus: () => triggerRef.current?.focus?.(),
    getSurfaces: () => [
      Platform.OS === 'web' ? document.getElementById(menuId) : null,
      Platform.OS === 'web' ? document.getElementById(panelId) : null,
    ],
  });

  // Facet variant includes an "all" item that maps to undefined.
  const showAllItem = variant === 'facet' && allLabel;

  const triggerStyle =
    variant === 'facet'
      ? {
          minHeight: 36,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          gap: designTokens.space.x2,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: designTokens.color.border,
          paddingHorizontal: 14,
        }
      : {
          minHeight: 40,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'space-between' as const,
          gap: designTokens.space.x3,
          minWidth: 160,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: designTokens.color.border,
          paddingHorizontal: 16,
        };

  const dropdownTop = variant === 'facet' ? 44 : 48;
  const resolvedDropdownMinWidth =
    dropdownMinWidth ?? (variant === 'facet' ? 180 : 180);

  return (
    <View nativeID={menuId} style={{ position: 'relative' }}>
      <MotionPressable
        ref={(node) => assignFocusableAnchorRef(triggerRef, node)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onAccessibilityEscape={() => {
          setOpen(false);
          triggerRef.current?.focus?.();
        }}
        onPress={() => setOpen((current) => !current)}
        preset="button"
        style={triggerStyle}
      >
        {variant === 'facet' ? (
          <AppText role="caption" numberOfLines={1}>
            {selectedLabel ?? label}
          </AppText>
        ) : (
          <AppText role="label">{selectedLabel ?? label}</AppText>
        )}
        <AppIcon
          name="chevronDown"
          size={variant === 'facet' ? 14 : 16}
          color={designTokens.color.textSecondary}
        />
      </MotionPressable>

      {open ? (
        <OverlayPortal
          anchorRef={triggerRef}
          placement={dropdownAlign === 'right' ? 'bottom-end' : 'bottom-start'}
          width={resolvedDropdownMinWidth}
        >
          <View
            nativeID={panelId}
            accessibilityRole="menu"
            style={{
              ...(Platform.OS === 'web'
                ? {}
                : {
                    position: 'absolute',
                    top: dropdownTop,
                    ...(dropdownAlign === 'right' ? { right: 0 } : { left: 0 }),
                  }),
              zIndex: designTokens.layer.popover,
              minWidth: resolvedDropdownMinWidth,
              gap: designTokens.space.x1,
              borderWidth: 1,
              borderColor: designTokens.color.border,
              borderRadius: 16,
              backgroundColor: designTokens.color.surface,
              padding: 10,
              ...designTokens.elevation.floating,
            }}
          >
            {showAllItem ? (
              <MotionPressable
                accessibilityRole="menuitem"
                accessibilityLabel={`${label}: все`}
                onPress={() => {
                  onSelect(undefined);
                  setOpen(false);
                }}
                preset="button"
                style={{
                  minHeight: designTokens.size.touch,
                  justifyContent: 'center',
                  borderRadius: designTokens.radius.small,
                  paddingHorizontal: designTokens.space.x2,
                }}
                interactionStyle={({ hovered, pressed }) => ({
                  backgroundColor:
                    hovered || pressed
                      ? designTokens.color.surfaceStrong
                      : 'transparent',
                })}
              >
                <AppText role="label">{allLabel}</AppText>
              </MotionPressable>
            ) : null}

            {options.map((option) => (
              <MotionPressable
                key={option.value}
                accessibilityRole="menuitem"
                accessibilityLabel={option.label}
                onPress={() => {
                  onSelect(option.value);
                  setOpen(false);
                }}
                preset="button"
                style={{
                  minHeight: designTokens.size.touch,
                  justifyContent: 'center',
                  borderRadius: designTokens.radius.small,
                  paddingHorizontal: designTokens.space.x2,
                }}
                interactionStyle={({ hovered, pressed }) => ({
                  backgroundColor:
                    hovered || pressed
                      ? designTokens.color.surfaceStrong
                      : 'transparent',
                })}
              >
                <AppText role="label" numberOfLines={1}>
                  {option.label}
                </AppText>
              </MotionPressable>
            ))}
          </View>
        </OverlayPortal>
      ) : null}
    </View>
  );
}
