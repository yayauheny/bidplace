import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Platform, ScrollView, View } from 'react-native';

import { useDismissibleOverlay } from '../layout/use-dismissible-overlay';
import { AppText } from '../ui/AppText';
import { FigmaButton } from './FigmaButton';
import { FigmaIconButton } from './FigmaIconButton';
import { OverlayDimmer } from './OverlayDimmer';
import { ResultsCountAction } from './ResultsCountAction';
import {
  isTabKey,
  nextFocusIndex,
  SHARE_SHEET_FOCUSABLE,
} from './share-sheet-focus';
import {
  filterSheetLayerStyle,
  filterSheetPanelStyle,
} from './filter-sheet-style';

export function FilterSheet({
  open,
  title,
  onClose,
  onClear,
  onApply,
  applyLabel = 'Применить',
  count,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onClear?: () => void;
  onApply?: () => void;
  applyLabel?: string;
  count?: number;
  children: ReactNode;
}) {
  const sheetRef = useRef<View>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const restoreFocus = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const element = returnFocusRef.current;
    if (element?.isConnected) {
      const focusTrigger = (attempt: number) => {
        if (!element.isConnected) return;
        element.focus({ preventScroll: true });
        if (document.activeElement === element || attempt >= 3) {
          returnFocusRef.current = null;
          return;
        }
        window.setTimeout(() => focusTrigger(attempt + 1), 16);
      };
      window.setTimeout(() => focusTrigger(0), 0);
    }
  }, []);

  useEffect(() => {
    if (
      !open ||
      Platform.OS !== 'web' ||
      typeof document === 'undefined' ||
      returnFocusRef.current
    ) {
      return;
    }
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      !activeElement.closest('[role="dialog"]')
    ) {
      returnFocusRef.current = activeElement;
    }
  }, [open]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const focusClose = (attempt: number) => {
      const control = document.querySelector<HTMLElement>(
        '#filter-sheet button:not([disabled]), #filter-sheet a[href], #filter-sheet input:not([disabled])',
      );
      control?.focus({ preventScroll: true });
      if (control || attempt >= 10) return;
      window.setTimeout(() => focusClose(attempt + 1), 50);
    };
    const timer = window.setTimeout(() => focusClose(0), 0);
    return () => {
      window.clearTimeout(timer);
      restoreFocus();
    };
  }, [open, restoreFocus]);

  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const trapTab = (event: KeyboardEvent) => {
      if (!isTabKey(event)) return;
      const root = document.getElementById('filter-sheet');
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(SHARE_SHEET_FOCUSABLE),
      ];
      if (focusable.length === 0) return;
      const current = focusable.findIndex(
        (node) => node === document.activeElement,
      );
      const next = nextFocusIndex(
        current < 0 ? 0 : current,
        focusable.length,
        event.shiftKey,
      );
      event.preventDefault();
      focusable[next]?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', trapTab);
    return () => document.removeEventListener('keydown', trapTab);
  }, [open]);

  useDismissibleOverlay({
    open,
    onClose: () => onClose(),
    getSurfaces: () => [
      sheetRef.current as unknown as {
        contains: (node: Node | null) => boolean;
      },
    ],
    restoreFocus,
  });

  if (!open) return null;

  const sheet = (
    <View
      style={[
        filterSheetLayerStyle(),
        Platform.OS === 'web' ? ({ position: 'fixed' } as const) : null,
      ]}
    >
      <OverlayDimmer onPress={onClose} />
      <View
        ref={sheetRef}
        nativeID="filter-sheet"
        role="dialog"
        accessibilityLabel={title}
        accessibilityViewIsModal
        style={filterSheetPanelStyle()}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            minHeight: 44,
          }}
        >
          <FigmaIconButton icon="x" label="Закрыть" onPress={onClose} />
          <AppText role="label" style={{ flex: 1 }}>
            {title}
          </AppText>
          {onClear ? (
            <FigmaButton label="Очистить" variant="ghost" onPress={onClear} />
          ) : null}
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 0 }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {onApply ? (
          count == null ? (
            <FigmaButton
              label={applyLabel}
              variant="solid"
              width="full"
              onPress={onApply}
            />
          ) : (
            <ResultsCountAction count={count} onPress={onApply} />
          )
        ) : null}
      </View>
    </View>
  );

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(sheet, document.body);
  }

  return sheet;
}
