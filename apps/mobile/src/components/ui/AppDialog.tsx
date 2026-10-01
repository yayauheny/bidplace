import * as Dialog from '@rn-primitives/dialog';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';
import {
  sheetBackdropEnter,
  sheetBackdropExit,
  sheetEnter,
  sheetExit,
} from '../../lib/layout-transition';

import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { appDialogHostStyle } from './app-dialog-host-style';
import { AppDialogFrame, AppDialogOverlay } from './app-dialog-layer';
import { MotionPressable } from './MotionPressable';

type AppDialogProps = {
  open: boolean;
  presentation?: 'dialog' | 'sheet';
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

function connectedDialogOpener(active: Element | null, scope: EventTarget | null) {
  if (!(active instanceof HTMLElement)) return null;
  if (scope instanceof Node && scope.contains(active)) return null;
  if (!active.isConnected) return null;
  const root = active.ownerDocument;
  if (active === root.body || active === root.documentElement) return null;
  return active;
}

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
  const openRef = useRef(open);
  const instanceMountedRef = useRef(false);
  openRef.current = open;
  useEffect(() => {
    instanceMountedRef.current = true;
    return () => {
      instanceMountedRef.current = false;
    };
  }, []);

  const isSheet = presentation === 'sheet';
  const overlay = (
    <AppDialogOverlay
      forceMount={isSheet ? true : undefined}
      style={{
        inset: 0,
        backgroundColor: isSheet
          ? designTokens.color.modalDimmer
          : designTokens.color.overlay,
        zIndex: designTokens.layer.modal,
      }}
    />
  );
  const content = (
    <Dialog.Content
      asChild
      forceMount={isSheet ? true : undefined}
      {...(Platform.OS === 'web'
        ? {
            onOpenAutoFocus: (event: Event) => {
              if (typeof document === 'undefined') return;
              const opener = connectedDialogOpener(document.activeElement, event.currentTarget);
              if (!opener) return;
              returnFocusRef.current = opener;
            },
            onCloseAutoFocus: (event: Event) => {
              // The installed dialog focuses its trigger and cancels the
              // scope's previous-element restore. These dialogs open without
              // Dialog.Trigger, so return focus stays on this callback.
              // A deferred close must not steal focus from this same live
              // instance after it opens again. Unmount leaves `open` true.
              event.preventDefault();
              if (openRef.current && instanceMountedRef.current) return;
              const element = returnFocusRef.current;
              returnFocusRef.current = null;
              if (!element?.isConnected) return;
              element.focus({ preventScroll: true });
            },
          }
        : {})}
      nativeID="app-dialog-content"
      style={{
        width: '100%',
        maxWidth: isSheet
          ? designTokens.layout.phoneWidth
          : designTokens.layout.dialogMaxWidth,
        maxHeight: Math.max(height - viewportGutter * 2, 0),
        zIndex: designTokens.layer.modal,
        borderWidth: 1,
        borderColor: 'rgba(20, 20, 20, 0.08)',
        borderRadius: isSheet
          ? designTokens.radius.shareSheet
          : designTokens.radius.dialog,
        ...(isSheet
          ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
          : {}),
        backgroundColor: designTokens.color.dialogSurface,
        padding: isSheet
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
              role={isSheet ? 'profileHeading' : 'sectionTitle'}
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
  );
  const frameStyle = appDialogHostStyle({
    presentation,
    width,
    viewportGutter,
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      {isSheet ? (
        <Dialog.Portal forceMount>
          {open ? (
            <Animated.View
              entering={sheetBackdropEnter}
              exiting={sheetBackdropExit}
            >
              {overlay}
            </Animated.View>
          ) : null}
          <AppDialogFrame style={frameStyle}>
            {open ? (
              <Animated.View
                entering={sheetEnter}
                exiting={sheetExit}
                style={{ width: '100%' }}
              >
                {content}
              </Animated.View>
            ) : null}
          </AppDialogFrame>
        </Dialog.Portal>
      ) : (
        <Dialog.Portal>
          {overlay}
          <AppDialogFrame style={frameStyle}>{content}</AppDialogFrame>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
