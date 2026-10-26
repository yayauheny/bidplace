import * as Dialog from '@rn-primitives/dialog';
import type { ElementRef, ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';

import {
  sheetBackdropEnter,
  sheetBackdropExit,
} from '../../lib/layout-transition';

import { FigmaIcon } from '../figma/FigmaIcon';
import { useVisibleViewport } from '../layout/use-visible-viewport';
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
import { focusDialogAfterEnter, useReturnFocus } from './use-return-focus';

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
        presentation?: 'dialog' | 'sheet' | 'compactSheet';
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
  const { height, width, offsetTop } = useVisibleViewport();
  const insets = useSafeAreaInsets();
  const palette = useAppTheme();
  const viewportGutter = designTokens.space.x5;
  const closeButtonRef = useRef<ElementRef<typeof MotionPressable>>(null);
  const openRef = useRef(open);
  const instanceMountedRef = useRef(false);
  openRef.current = open;
  const returnFocus = useReturnFocus({
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
    focusDialogAfterEnter(button);
  }, []);
  useEffect(() => {
    instanceMountedRef.current = true;
    return () => {
      instanceMountedRef.current = false;
    };
  }, []);

  const isSheet = presentation !== 'dialog';
  const sharedBackdrop = useSharedSheetBackdrop(open && isSheet);
  const isMediaSheet = presentation === 'mediaSheet';
  const compact = presentation === 'compactSheet';
  const mobileCompact =
    compact && width <= designTokens.layout.sheetFillViewportMax;
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
      hitSlop={
        isMediaSheet
          ? mediaSheetCloseHitSlop
          : compact && !mobileCompact
            ? 6
            : undefined
      }
      style={
        mobileCompact
          ? {
              position: 'absolute',
              top: -designTokens.space.x3,
              width: designTokens.size.touch,
              height: designTokens.size.touch,
              alignSelf: 'center',
              alignItems: 'center',
              paddingTop: designTokens.space.x3,
            }
          : isMediaSheet
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
      {mobileCompact ? (
        <View
          style={{
            width: designTokens.auth.handleWidth,
            height: designTokens.auth.handleHeight,
            borderRadius: designTokens.radius.pill,
            backgroundColor: palette.quietFill,
          }}
        />
      ) : isMediaSheet ? (
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
  ) : compact ? (
    <>
      <SheetDragHandle>
        <View
          style={{ gap: designTokens.space.x1 + designTokens.space.x1 / 2 }}
        >
          <View
            style={{
              height: designTokens.auth.handleSlot,
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            {mobileCompact ? (
              closeButton
            ) : (
              <View
                style={{
                  width: designTokens.auth.handleWidth,
                  height: designTokens.auth.handleHeight,
                  borderRadius: designTokens.radius.pill,
                  backgroundColor: palette.quietFill,
                }}
              />
            )}
          </View>
          <Dialog.Title asChild>
            <AppText role="sheetTitle" style={centeredTextStyle}>
              {title}
            </AppText>
          </Dialog.Title>
          {!mobileCompact ? (
            <View style={{ position: 'absolute', right: 0, top: 0 }}>
              {closeButton}
            </View>
          ) : null}
        </View>
      </SheetDragHandle>
      {children}
    </>
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
        borderWidth: isMediaSheet || compact || bare ? 0 : 1,
        borderColor: palette.dialogBorder,
        borderRadius:
          isMediaSheet || compact
            ? designTokens.radius.mediaSheet
            : isSheet
              ? designTokens.radius.shareSheet
              : designTokens.radius.dialog,
        ...(isSheet
          ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
          : {}),
        backgroundColor: palette.dialogSurface,
        padding:
          isMediaSheet || compact || bare
            ? 0
            : isSheet
              ? designTokens.layout.gutter
              : width >= 600
                ? designTokens.space.x8
                : designTokens.space.x5,
        ...(compact
          ? {
              paddingHorizontal: designTokens.space.x5,
              paddingTop: designTokens.space.x3,
            }
          : {}),
        ...(isSheet
          ? {
              paddingBottom:
                bare && bottomSpace
                  ? appDialogSheetBottomSpace(bottomSpace, insets.bottom)
                  : 0,
            }
          : {}),
        ...(isMediaSheet || compact || bare
          ? {}
          : { boxShadow: palette.floatingShadow }),
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
            compact
              ? {
                  gap: designTokens.space.x3 + designTokens.space.x1 / 2,
                  paddingBottom: appDialogSheetBottomSpace(
                    bottomSpace ?? designTokens.space.x10,
                    insets.bottom,
                  ),
                  minWidth: 0,
                }
              : isMediaSheet
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
  if (Platform.OS === 'web') {
    Object.assign(frameStyle, { height, top: offsetTop, bottom: undefined });
  }

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
            <AppDialogSheetMotion open={open} onEntered={focusAfterEnter}>
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
