import * as Dialog from '@rn-primitives/dialog';
import type { ElementRef, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { designTokens } from '@bidplace/design-tokens';

import {
  sheetBackdropEnter,
  sheetBackdropExit,
  sheetEnter,
} from '../../lib/layout-transition';

import { FigmaIcon } from '../figma/FigmaIcon';
import { useAppTheme } from '../../providers/theme-provider';
import { AppText } from './AppText';
import { AppDialogSheetMotion } from './AppDialogSheetMotion';
import { SheetDragSurface, SheetDragHandle } from './SheetDragSurface';
import { useSharedSheetBackdrop } from './sheet-backdrop';
import {
  appDialogHostStyle,
  appDialogSheetBottomSpace,
} from './app-dialog-host-style';
import { AppDialogFrame, AppDialogOverlay } from './app-dialog-layer';
import { MotionPressable } from './MotionPressable';
import { useReturnFocus } from './use-return-focus';

type AppDialogBaseProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
  returnFocusRef?: { current: { focus?: () => void } | null };
  bottomSpace?: 20 | 40;
  bare?: boolean;
};

type AppDialogProps = AppDialogBaseProps &
  (
    | {
        presentation?: 'dialog' | 'sheet';
        media?: never;
      }
    | { presentation: 'mediaSheet'; media: ReactNode }
  );

const mediaSheetCloseHitSlop =
  (designTokens.size.touch - designTokens.size.mediaSheetClose) / 2;
const centeredTextStyle = { textAlign: 'center' } as const;

export function AppDialog({
  open,
  presentation = 'dialog',
  media,
  title,
  description,
  onClose,
  children,
  accessibilityLabel,
  returnFocusRef: explicitReturnFocusRef,
  bottomSpace,
  bare = false,
}: AppDialogProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const palette = useAppTheme();
  const viewportGutter = designTokens.space.x5;
  const closeButtonRef = useRef<ElementRef<typeof MotionPressable>>(null);
  const openRef = useRef(open);
  const instanceMountedRef = useRef(false);
  openRef.current = open;
  const returnFocus = useReturnFocus({
    open: presentation !== 'dialog' ? open : undefined,
    explicitRef: explicitReturnFocusRef,
    focusOnOpen: () =>
      closeButtonRef.current instanceof HTMLElement
        ? closeButtonRef.current
        : null,
    shouldRestore: () => !openRef.current || !instanceMountedRef.current,
  });
  const focusAfterEnter = useCallback(() => {
    if (
      Platform.OS !== 'web' ||
      !openRef.current ||
      !instanceMountedRef.current
    )
      return;
    const button = closeButtonRef.current;
    if (!(button instanceof HTMLElement)) return;
    if (button.closest('[role="dialog"]')?.contains(document.activeElement))
      return;
    button.focus({ preventScroll: true });
  }, []);
  const entering = useMemo(
    () =>
      sheetEnter((finished) => {
        'worklet';
        if (finished) scheduleOnRN(focusAfterEnter);
      }),
    [focusAfterEnter],
  );
  useEffect(() => {
    instanceMountedRef.current = true;
    return () => {
      instanceMountedRef.current = false;
    };
  }, []);

  const isSheet = presentation !== 'dialog';
  const sharedBackdrop = useSharedSheetBackdrop(open && isSheet);
  const isMediaSheet = presentation === 'mediaSheet';
  const overlay = (
    <AppDialogOverlay
      forceMount={isSheet ? true : undefined}
      style={{
        inset: 0,
        backgroundColor:
          sharedBackdrop && isSheet
            ? 'transparent'
            : isSheet
              ? palette.modalDimmer
              : palette.overlay,
        zIndex:
          sharedBackdrop && isSheet
            ? designTokens.layer.modal - 1
            : designTokens.layer.modal,
      }}
    />
  );
  const closeButton = (
    <MotionPressable
      ref={closeButtonRef}
      accessibilityRole="button"
      accessibilityLabel="Закрыть окно"
      onPress={onClose}
      preset="icon"
      hitSlop={isMediaSheet ? mediaSheetCloseHitSlop : undefined}
      style={
        isMediaSheet
          ? {
              width: designTokens.size.mediaSheetClose,
              height: designTokens.size.mediaSheetClose,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: designTokens.radius.pill,
            }
          : {
              width: 32,
              height: 32,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: designTokens.radius.pill,
            }
      }
      interactionStyle={({ hovered, pressed }) => ({
        backgroundColor:
          hovered || pressed
            ? palette.surfaceStrong
            : isMediaSheet
              ? palette.dialogSurface
              : 'transparent',
      })}
    >
      {isMediaSheet ? (
        <FigmaIcon
          name="x"
          size={designTokens.size.buttonIconFrame}
          color={palette.inkStrong}
          strokeWidthPx={designTokens.stroke.mediaSheetClosePx}
        />
      ) : (
        <FigmaIcon name="x" size={22} />
      )}
    </MotionPressable>
  );
  const body = bare ? (
    children
  ) : isMediaSheet ? (
    <>
      <View>
        <View
          style={{
            borderRadius: designTokens.radius.mediaSheet,
            overflow: 'hidden',
          }}
        >
          <SheetDragHandle>{media}</SheetDragHandle>
        </View>
        <View
          style={{
            position: 'absolute',
            top: designTokens.space.x4,
            right: designTokens.space.x4,
          }}
        >
          {closeButton}
        </View>
      </View>
      <View
        style={{
          paddingHorizontal: designTokens.layout.gutter,
          gap: designTokens.space.x4,
        }}
      >
        <View
          style={{
            gap: designTokens.space.x2,
            paddingHorizontal: designTokens.space.mediaSheetTextInset,
            paddingTop: designTokens.space.mediaSheetTextInset,
            paddingBottom: designTokens.space.x2,
          }}
        >
          <Dialog.Title asChild>
            <AppText
              role="mediaSheetTitle"
              tone="strong"
              style={centeredTextStyle}
            >
              {title}
            </AppText>
          </Dialog.Title>
          {description ? (
            <Dialog.Description asChild>
              <AppText
                role="mediaSheetBody"
                tone="subdued"
                style={centeredTextStyle}
              >
                {description}
              </AppText>
            </Dialog.Description>
          ) : null}
        </View>
        <View style={{ gap: designTokens.space.x3 }}>{children}</View>
      </View>
    </>
  ) : (
    <>
      <SheetDragHandle>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: designTokens.space.x4,
            minWidth: 0,
            alignSelf: 'stretch',
          }}
        >
          <Dialog.Title asChild>
            <AppText
              role={isSheet ? 'profileHeading' : 'sectionTitle'}
              style={{ flex: 1, minWidth: 0 }}
            >
              {title}
            </AppText>
          </Dialog.Title>
          {closeButton}
        </View>
      </SheetDragHandle>
      {description ? (
        <Dialog.Description asChild>
          <AppText role="bodySmall" tone="secondary">
            {description}
          </AppText>
        </Dialog.Description>
      ) : null}
      <View
        style={{
          gap: designTokens.space.x3,
          minWidth: 0,
          alignSelf: 'stretch',
        }}
      >
        {children}
      </View>
    </>
  );
  const content = (
    <Dialog.Content
      asChild
      forceMount={isSheet ? true : undefined}
      {...(Platform.OS === 'web' ? returnFocus : {})}
      nativeID="app-dialog-content"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: '100%',
        maxWidth: isSheet ? undefined : designTokens.layout.dialogMaxWidth,
        maxHeight: Math.max(height - viewportGutter * 2, 0),
        minWidth: 0,
        flexShrink: Platform.OS === 'web' ? 1 : undefined,
        ...(Platform.OS === 'web' ? { pointerEvents: 'auto' as const } : {}),
        zIndex: designTokens.layer.modal,
        borderWidth: isMediaSheet || bare ? 0 : 1,
        borderColor: palette.dialogBorder,
        borderRadius: isMediaSheet
          ? designTokens.radius.mediaSheet
          : isSheet
            ? designTokens.radius.shareSheet
            : designTokens.radius.dialog,
        ...(isSheet
          ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
          : {}),
        backgroundColor: palette.dialogSurface,
        padding:
          isMediaSheet || bare
            ? 0
            : isSheet
              ? designTokens.layout.gutter
              : width >= 600
                ? designTokens.space.x8
                : designTokens.space.x5,
        ...(isSheet
          ? {
              paddingBottom:
                bare && bottomSpace
                  ? appDialogSheetBottomSpace(bottomSpace, insets.bottom)
                  : 0,
            }
          : {}),
        ...(isMediaSheet || bare ? {} : { boxShadow: palette.floatingShadow }),
      }}
    >
      {bare ? (
        body
      ) : (
        <ScrollView
          accessibilityViewIsModal
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator
          style={
            Platform.OS === 'web'
              ? { flexShrink: 1, minHeight: 0, minWidth: 0, width: '100%' }
              : { minWidth: 0, width: '100%' }
          }
          contentContainerStyle={
            isMediaSheet
              ? {
                  gap: designTokens.space.x5,
                  paddingBottom: appDialogSheetBottomSpace(
                    bottomSpace ?? designTokens.space.x5,
                    insets.bottom,
                  ),
                  minWidth: 0,
                }
              : {
                  gap: designTokens.space.x4,
                  paddingBottom: isSheet
                    ? appDialogSheetBottomSpace(
                        bottomSpace ??
                          designTokens.layout.gutter + designTokens.space.x1,
                        insets.bottom,
                      )
                    : designTokens.space.x1,
                  minWidth: 0,
                }
          }
        >
          {body}
        </ScrollView>
      )}
    </Dialog.Content>
  );
  const frameStyle = appDialogHostStyle({
    presentation,
    viewportGutter,
    viewportWidth: width,
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
            sharedBackdrop ? (
              overlay
            ) : (
              <Animated.View
                entering={sheetBackdropEnter}
                exiting={sheetBackdropExit}
              >
                {overlay}
              </Animated.View>
            )
          ) : null}
          <AppDialogFrame style={frameStyle}>
            <AppDialogSheetMotion open={open} entering={entering} onEntered={focusAfterEnter}>
              <SheetDragSurface enabled={open} onRequestClose={onClose}>
                {content}
              </SheetDragSurface>
            </AppDialogSheetMotion>
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
