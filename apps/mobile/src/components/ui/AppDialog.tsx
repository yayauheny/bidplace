import * as Dialog from '@rn-primitives/dialog';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { appDialogHostStyle } from './app-dialog-host-style';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { MotionPressable } from './MotionPressable';

type AppDialogProps = {
  open: boolean;
  presentation?: 'dialog' | 'sheet';
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AppDialog({
  open,
  presentation = 'dialog',
  title,
  description,
  onClose,
  children,
}: AppDialogProps) {
  const { height, width } = useWindowDimensions();
  const viewportGutter = designTokens.space.x5;
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
    const focusDialogControl = (attempt: number) => {
      const control = document.querySelector<HTMLElement>(
        '[role="dialog"] input:not([disabled]), [role="dialog"] textarea:not([disabled]), [role="dialog"] select:not([disabled]), [role="dialog"] button:not([disabled]), [role="dialog"] a[href]',
      );
      if (control) {
        control.focus({ preventScroll: true });
        if (document.activeElement === control || attempt >= 10) return;
      }
      if (attempt < 10)
        window.setTimeout(() => focusDialogControl(attempt + 1), 50);
    };
    const focusTimer = window.setTimeout(() => focusDialogControl(0), 0);

    return () => {
      window.clearTimeout(focusTimer);
      restoreFocus();
    };
  }, [open, restoreFocus]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          closeOnPress
          style={{
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            inset: 0,
            backgroundColor: presentation === 'sheet' ? designTokens.color.modalDimmer : designTokens.color.overlay,
            zIndex: designTokens.layer.modal,
          }}
        />
        <View
          style={appDialogHostStyle({
            presentation,
            width,
            viewportGutter,
          })}
        >
          <Dialog.Content
            asChild
            onOpenAutoFocus={() => {
              if (Platform.OS !== 'web' || typeof document === 'undefined') {
                return;
              }
              if (document.activeElement instanceof HTMLElement) {
                returnFocusRef.current = document.activeElement;
              }
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreFocus();
            }}
            nativeID="app-dialog-content"
            style={{
              width: '100%',
              maxWidth:
                presentation === 'sheet'
                  ? designTokens.layout.phoneWidth
                  : designTokens.layout.dialogMaxWidth,
              maxHeight: Math.max(height - viewportGutter * 2, 0),
              zIndex: designTokens.layer.modal,
              borderWidth: 1,
              borderColor: 'rgba(20, 20, 20, 0.08)',
              borderRadius:
                presentation === 'sheet'
                  ? designTokens.radius.shareSheet
                  : designTokens.radius.dialog,
              ...(presentation === 'sheet'
                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                : {}),
              backgroundColor: designTokens.color.dialogSurface,
              padding:
                presentation === 'sheet'
                  ? designTokens.space.pageGutter
                  : width >= 600
                    ? designTokens.space.x8
                    : designTokens.space.x5,
              ...designTokens.elevation.floating,
            }}
          >
            <ScrollView
              accessibilityViewIsModal
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={{
                gap: designTokens.space.x4,
                paddingBottom: designTokens.space.x1,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: designTokens.space.x4,
                }}
              >
                <Dialog.Title asChild>
                  <AppText
                    role={
                      presentation === 'sheet'
                        ? 'profileHeading'
                        : 'sectionTitle'
                    }
                    style={
                      presentation === 'dialog' && width >= 600
                        ? {
                            fontSize: 38,
                            lineHeight: 40,
                            letterSpacing: -1.1,
                          }
                        : undefined
                    }
                  >
                    {title}
                  </AppText>
                </Dialog.Title>
                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel="Закрыть окно"
                  onPress={onClose}
                  preset="icon"
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: designTokens.radius.pill,
                  }}
                  interactionStyle={({ hovered, pressed }) => ({
                    backgroundColor:
                      hovered || pressed
                        ? designTokens.color.surfaceStrong
                        : 'transparent',
                  })}
                >
                  <AppIcon name="x" size={22} />
                </MotionPressable>
              </View>
              {description ? (
                <Dialog.Description asChild>
                  <AppText role="bodySmall" tone="secondary">
                    {description}
                  </AppText>
                </Dialog.Description>
              ) : null}
              <View style={{ gap: designTokens.space.x3 }}>{children}</View>
            </ScrollView>
          </Dialog.Content>
        </View>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
