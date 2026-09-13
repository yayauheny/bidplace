import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Modal, Platform, ScrollView, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { AppText } from '../ui/AppText';
import { MotionPressable } from '../ui/MotionPressable';
import { FigmaButton } from './FigmaButton';
import { FigmaIcon } from './FigmaIcon';
import { FilterSheetActionRow } from './FilterSheetActionRow';
import { OverlayDimmer } from './OverlayDimmer';
import {
  filterSheetHeaderStyle,
  filterSheetPanelStyle,
  filterSheetTitleStyle,
} from './filter-sheet-style';
import { useDismissibleOverlay } from '../layout/use-dismissible-overlay';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type FocusTarget = { focus?: () => void };

export function FilterSheet({
  open,
  onClose,
  title,
  showBack = false,
  onBack,
  onClear,
  clearLabel = 'Очистить',
  primaryAction,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onClear?: () => void;
  clearLabel?: string;
  primaryAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  };
  returnFocusRef?: { current: { focus?: () => void } | null };
  children: ReactNode;
}) {
  const titleId = useId();
  const dialogId = `filter-sheet-${titleId}`;
  const openerRef = useRef<FocusTarget | null>(null);
  const wasOpenRef = useRef(false);

  useDismissibleOverlay({
    open,
    onClose: () => onClose(),
    getSurfaces: () => [
      Platform.OS === 'web' ? document.getElementById(dialogId) : null,
    ],
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (open) {
      openerRef.current = document.activeElement as FocusTarget | null;
    } else if (wasOpenRef.current) {
      const opener = returnFocusRef?.current ?? openerRef.current;
      requestAnimationFrame(() => opener?.focus?.());
    }
    wasOpenRef.current = open;
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const root = document.getElementById(dialogId);
    if (!root) return;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.tabIndex !== -1 && node.offsetParent !== null,
      );

    const first = focusables()[0];
    first?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = focusables();
      if (nodes.length === 0) return;
      const start = nodes[0];
      const end = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end.focus();
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!root.contains(event.target as Node)) {
        focusables()[0]?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [dialogId, open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          position: 'relative',
          alignItems: 'center',
        }}
      >
        <OverlayDimmer onPress={onClose} />
        <View
          nativeID={dialogId}
          accessibilityViewIsModal
          accessibilityLabel={title}
          style={filterSheetPanelStyle()}
          {...(Platform.OS === 'web'
            ? ({ role: 'dialog', 'aria-modal': true } as object)
            : {})}
        >
          <View style={filterSheetHeaderStyle()}>
            <MotionPressable
              accessibilityRole="button"
              accessibilityLabel={showBack ? 'Назад' : 'Закрыть'}
              hitSlop={figmaTokens.space.headerIconHitSlop}
              onPress={showBack ? (onBack ?? onClose) : onClose}
              preset="icon"
              style={{
                width: figmaTokens.size.buttonIconFrame,
                height: figmaTokens.size.buttonIconFrame,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FigmaIcon
                name={showBack ? 'arrow-left-01' : 'x'}
                size={figmaTokens.size.buttonIconFrame}
              />
            </MotionPressable>
            <AppText
              nativeID={titleId}
              role={showBack ? 'profileHeading' : 'screenTitle'}
              numberOfLines={1}
              style={filterSheetTitleStyle()}
            >
              {title}
            </AppText>
            {onClear ? (
              <FigmaButton
                label={clearLabel}
                variant="ghost"
                onPress={onClear}
              />
            ) : (
              <View style={{ width: figmaTokens.size.iconButton }} />
            )}
          </View>
          <ScrollView
            style={{ flex: 1, marginTop: figmaTokens.space.x2 }}
            contentContainerStyle={{
              paddingTop: figmaTokens.space.identityGap,
              paddingBottom: figmaTokens.space.x4,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {primaryAction ? (
            <FilterSheetActionRow
              primaryLabel={primaryAction.label}
              onPrimary={primaryAction.onPress}
              primaryDisabled={primaryAction.disabled}
              primaryLoading={primaryAction.loading}
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
