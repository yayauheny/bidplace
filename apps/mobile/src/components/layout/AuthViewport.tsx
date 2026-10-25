import * as Dialog from '@rn-primitives/dialog';
import { useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform, ScrollView, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVisibleViewport } from './use-visible-viewport';
import { isAuthDialog } from './auth-viewport-layout';
import { AppDialogSheetMotion } from '../ui/AppDialogSheetMotion';

import {
  clearAuthHistory,
  publishAuthHistory,
} from '../../features/auth/auth-browser-history';
import {
  authBrowserLeaveTarget,
  authLeaveCommit,
  canDismissAuthToOrigin,
  authNavigationDismissal,
  authNavigationTarget,
} from '../../features/auth/auth-dismissal';
import {
  AuthExitConfirm,
  type AuthExitCopy,
} from '../../features/auth/auth-exit-confirm';
import {
  AuthSheetGuardProvider,
  type AuthSheetGuard,
} from '../../features/auth/auth-sheet-context';
import type { SafeRedirect } from '../../features/auth/auth-redirect';
import { BidplaceMark, BidplaceWordmark } from '../branding/BidplaceBrand';
import { AppText } from '../ui';
import { SheetDragSurface, SheetDragHandle } from '../ui/SheetDragSurface';
import { FigmaIcon } from '../figma/FigmaIcon';
import { useAppTheme } from '../../providers/theme-provider';
import { AppDialogFrame, AppDialogOverlay } from '../ui/app-dialog-layer';
import { appDialogHostStyle } from '../ui/app-dialog-host-style';
import { MotionPressable } from '../ui/MotionPressable';
import { focusDialogAfterEnter, useReturnFocus } from '../ui/use-return-focus';

function screenBrandInset() {
  return {
    markClearance: designTokens.auth.markTop + designTokens.auth.markSlotHeight,
    wordmarkClearance:
      designTokens.auth.wordmarkBottom + designTokens.auth.wordmarkHeight,
  };
}

function brandContentOffset(
  scrollHeight: number,
  contentHeight: number,
  markClearance: number,
  wordmarkClearance: number,
) {
  const ideal = (scrollHeight - contentHeight) / 2;
  const maxTop = scrollHeight - wordmarkClearance - contentHeight;
  if (maxTop < markClearance) return markClearance;
  return Math.min(Math.max(ideal, markClearance), maxTop);
}

type NavigationAction = {
  type?: string;
  payload?: { name?: string; params?: { screen?: string } };
};

type AuthViewportProps = {
  title: string;
  children: ReactNode;
  tone?: 'login' | 'section';
  presentation?: 'sheet' | 'screen';
} & (
  | { protectEnteredData: true; exit: AuthExitCopy }
  | { protectEnteredData?: false; exit?: undefined }
);

export function AuthViewport(props: AuthViewportProps) {
  const {
    title,
    children,
    tone = 'login',
    presentation = 'sheet',
  } = props;
  const protectEnteredData = props.protectEnteredData === true;
  const exit = protectEnteredData ? props.exit : undefined;
  const palette = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const rootNavigation = useNavigation('/');
  const focused = useIsFocused();
  const historyId = useId();
  const { height, width, offsetTop } = useVisibleViewport();
  const insets = useSafeAreaInsets();
  const [screenContentHeight, setScreenContentHeight] = useState(0);
  const [guard, setGuard] = useState<AuthSheetGuard>({
    dirty: false,
    busy: false,
  });
  const [confirm, setConfirm] = useState(false);
  const [released, setReleased] = useState(false);
  const [closing, setClosing] = useState(false);
  const screenScrollRef = useRef<ScrollView>(null);
  const pendingAction = useRef<NavigationAction | null>(null);
  const browserLeavePath = useRef<string | null>(null);
  // Browser Back/Forward traversal that was intercepted while asking to
  // abort: completing the leave must finish that same traversal (restore
  // moved history back to the form), not replace the entry with a copy.
  const browserLeaveTraversal = useRef<{ delta: number } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const releasedRef = useRef(false);
  const completionRef = useRef<SafeRedirect | null>(null);
  // Focus restoration on close is only allowed for a dismissal back to the
  // originating page; completing auth navigates to a new target and must not
  // steal focus there.
  const allowRestoreRef = useRef(false);
  const sheetReturnFocus = useReturnFocus({
    shouldRestore: () => allowRestoreRef.current,
    // Landing on the primary form field (not the first button) keeps keyboard
    // users inside the active form across login/forgot/reset transitions.
    focusOnOpen: () =>
      typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLElement>('#auth-sheet input'),
    fallback: () =>
      typeof document === 'undefined'
        ? null
        : document.querySelector<HTMLElement>(
            '[data-testid="figma-floating-dock"] a[href], [data-testid="figma-floating-dock"] [role="button"], [data-testid="desktop-navigation"] a[href], [data-testid="desktop-navigation"] [role="button"]',
          ),
  });
  const focusedRef = useRef(focused);
  const guardRef = useRef(guard);
  const protectEnteredDataRef = useRef(protectEnteredData);
  focusedRef.current = focused;
  guardRef.current = guard;
  protectEnteredDataRef.current = protectEnteredData;

  const onGuard = useCallback((next: AuthSheetGuard) => {
    setGuard((current) =>
      current.dirty === next.dirty && current.busy === next.busy
        ? current
        : next,
    );
  }, []);

  const openConfirm = useCallback(() => {
    if (
      typeof document !== 'undefined' &&
      document.activeElement instanceof HTMLElement
    ) {
      if (document.activeElement.closest('#auth-sheet')) {
        returnFocus.current = document.activeElement;
      }
    }
    setConfirm(true);
  }, []);
  if (Platform.OS === 'web') {
    if (focused) {
      publishAuthHistory({
        id: historyId,
        dirty: guard.dirty,
        busy: guard.busy,
        protectEnteredData,
        released: () => releasedRef.current,
        completed: () => completionRef.current !== null,
        confirm: openConfirm,
        rememberLeave: (path, traversal) => {
          browserLeavePath.current = path;
          browserLeaveTraversal.current = traversal;
          pendingAction.current = null;
        },
      });
    } else {
      clearAuthHistory(historyId);
    }
  }

  const complete = useCallback(
    (next: SafeRedirect) => {
      if (!focusedRef.current || completionRef.current || releasedRef.current)
        return;
      completionRef.current = next;
      releasedRef.current = true;
      allowRestoreRef.current = false;
      browserLeavePath.current = null;
      browserLeaveTraversal.current = null;
      pendingAction.current = null;
      setReleased(true);
      setConfirm(false);
      router.replace(next as Href);
    },
    [router],
  );

  const finishLeave = useCallback(() => {
    if (!releasedRef.current || !allowRestoreRef.current) return;
    const action = pendingAction.current;
    const left = browserLeavePath.current;
    const traversal = browserLeaveTraversal.current;
    pendingAction.current = null;
    browserLeavePath.current = null;
    browserLeaveTraversal.current = null;
    const commit = authLeaveCommit({ hasNavigationAction: action !== null });
    if (commit === 'dispatch' && action) {
      navigation.dispatch(action as never);
      return;
    }
    if (traversal && typeof window !== 'undefined') {
      // Finish the interrupted Back/Forward: history already holds the
      // original entries, so replay the same delta instead of pushing a copy.
      window.history.go(-traversal.delta);
      return;
    }
    if (left) {
      router.dismissTo(authBrowserLeaveTarget(left) as Href);
      return;
    }
    // Pop the whole auth flow, preserving the originating public route state.
    if (canDismissAuthToOrigin(rootNavigation.getState())) {
      rootNavigation.goBack();
      return;
    }
    router.replace('/');
  }, [navigation, rootNavigation, router]);

  const commitLeave = useCallback(() => {
    if (releasedRef.current) return;
    allowRestoreRef.current = true;
    releasedRef.current = true;
    setReleased(true);
    setConfirm(false);
    setClosing(true);
  }, []);

  const requestDismiss = useCallback(() => {
    if (!focusedRef.current || releasedRef.current) return;
    const decision = authNavigationDismissal({
      dirty: guardRef.current.dirty,
      busy: guardRef.current.busy,
      protectEnteredData: protectEnteredDataRef.current,
      targetRoute: undefined,
      released: false,
    });
    browserLeavePath.current = null;
    browserLeaveTraversal.current = null;
    pendingAction.current = null;
    if (decision === 'keep') return;
    if (decision === 'allow') {
      commitLeave();
      return;
    }
    openConfirm();
  }, [commitLeave, openConfirm]);

  usePreventRemove(
    focused && !released && (guard.busy || (protectEnteredData && guard.dirty)),
    ({ data }) => {
      if (!focusedRef.current) {
        navigation.dispatch(data.action);
        return;
      }
      if (releasedRef.current || completionRef.current) {
        navigation.dispatch(data.action);
        return;
      }
      const action = data.action as NavigationAction;
      const decision = authNavigationDismissal({
        dirty: guardRef.current.dirty,
        busy: guardRef.current.busy,
        protectEnteredData: protectEnteredDataRef.current,
        targetRoute: authNavigationTarget(action),
        released: false,
      });
      if (decision === 'allow') {
        navigation.dispatch(data.action);
        return;
      }
      if (decision === 'keep') return;
      pendingAction.current = action;
      browserLeavePath.current = null;
      browserLeaveTraversal.current = null;
      openConfirm();
    },
  );

  useEffect(() => {
    return () => {
      clearAuthHistory(historyId);
    };
  }, [historyId]);

  useEffect(() => {
    if (presentation !== 'screen') return;
    screenScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [height, presentation]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !focused)
      return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const sheet = document.getElementById('auth-sheet');
      // Radix can restore its container after enter; it is not a form control.
      if (!releasedRef.current && sheet && target === sheet.closest('[role="dialog"]') && !sheet.closest('[inert]')) {
        const previous = returnFocus.current;
        focusDialogAfterEnter(previous?.isConnected && sheet.contains(previous) ? previous : sheet.querySelector<HTMLElement>('input'));
      }
      if (target.closest('#auth-sheet')) returnFocus.current = target;
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [focused]);

  const continueForm = () => {
    pendingAction.current = null;
    browserLeavePath.current = null;
    browserLeaveTraversal.current = null;
    setConfirm(false);
    const element = returnFocus.current;
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        if (element?.isConnected) element.focus();
      });
    }
  };

  // Same contract as AppDialog: once the entering animation finishes, land
  // keyboard focus on the primary form field if it is not inside the sheet
  // yet. Never steals focus already in the sheet (login↔forgot transitions).
  const focusAfterEnter = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (!focusedRef.current || releasedRef.current) return;
    const sheet = document.getElementById('auth-sheet');
    if (!sheet) return;
    focusDialogAfterEnter(sheet.querySelector<HTMLElement>('input'));
  }, []);

  const screen = presentation === 'screen';
  const desktopDialog = !screen && isAuthDialog(width);
  const brandInset = screenBrandInset();
  const screenBandHeight = screen
    ? height -
      designTokens.auth.screenPaddingTop -
      designTokens.auth.screenPaddingBottom
    : 0;
  const screenMeasured = screen && screenContentHeight > 0;
  const screenIdeal = screenMeasured
    ? (screenBandHeight - screenContentHeight) / 2
    : 0;
  const screenOffset = screenMeasured
    ? brandContentOffset(
        screenBandHeight,
        screenContentHeight,
        brandInset.markClearance,
        brandInset.wordmarkClearance,
      )
    : 0;
  const screenCentered = !screenMeasured || screenOffset === screenIdeal;
  const contentGap = screen
    ? designTokens.auth.screenGap
    : desktopDialog
      ? designTokens.auth.dialogSectionGap
      : tone === 'login'
        ? designTokens.auth.loginGap
        : designTokens.auth.sectionGap;
  const formGap =
    tone === 'login'
      ? designTokens.auth.loginFormGap
      : designTokens.auth.formGap;
  const frameStyle = {
    ...appDialogHostStyle({
      presentation: desktopDialog ? 'dialog' : 'sheet',
      viewportGutter: designTokens.space.x5,
      viewportWidth: width,
    }),
    width: '100%' as const,
    maxWidth: '100%' as const,
    height,
    top: offsetTop,
    bottom: undefined,
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: screen ? palette.canvas : 'transparent',
      }}
    >
      <AuthSheetGuardProvider onGuard={onGuard} complete={complete}>
        <Dialog.Root
          open={focused}
          onOpenChange={(next) => {
            if (!focusedRef.current || next) return;
            requestDismiss();
          }}
        >
          <Dialog.Portal forceMount={Platform.OS === 'web' ? true : undefined}>
            <View
              pointerEvents={focused ? 'box-none' : 'none'}
              accessibilityElementsHidden={!focused}
              importantForAccessibility={
                focused ? 'auto' : 'no-hide-descendants'
              }
              style={
                focused
                  ? {
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }
                  : { display: 'none' }
              }
              {...(Platform.OS === 'web' && !focused ? { inert: true } : {})}
            >
              {screen ? null : (
                <AppDialogOverlay
                  style={{
                    inset: 0,
                    backgroundColor: 'transparent',
                    zIndex: designTokens.layer.modal,
                  }}
                />
              )}
              <AppDialogFrame style={frameStyle}>
                <View
                  style={{
                    width: '100%',
                    maxWidth: desktopDialog
                      ? designTokens.auth.dialogMaxWidth
                      : undefined,
                  }}
                >
                  <AppDialogSheetMotion
                    open={focused && !closing}
                    onExited={finishLeave}
                    onEntered={focusAfterEnter}
                  >
                    <SheetDragSurface
                      enabled={
                        !screen &&
                        !desktopDialog &&
                        focused &&
                        !closing &&
                        !guard.busy
                      }
                      onRequestClose={requestDismiss}
                    >
                      <Dialog.Content
                        forceMount={Platform.OS === 'web' ? true : undefined}
                        nativeID={focused ? 'auth-sheet' : undefined}
                        aria-modal={focused}
                        onOpenAutoFocus={sheetReturnFocus.onOpenAutoFocus}
                        onCloseAutoFocus={sheetReturnFocus.onCloseAutoFocus}
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxHeight: screen
                            ? height
                            : Math.max(
                                0,
                                height -
                                  (desktopDialog
                                    ? 2 * designTokens.space.x5
                                    : insets.top + designTokens.space.x3),
                              ),
                          minHeight: screen ? height : undefined,
                          overflow: 'hidden',
                          borderTopLeftRadius: screen
                            ? 0
                            : desktopDialog
                              ? designTokens.auth.dialogRadius
                              : designTokens.auth.sheetRadius,
                          borderTopRightRadius: screen
                            ? 0
                            : desktopDialog
                              ? designTokens.auth.dialogRadius
                              : designTokens.auth.sheetRadius,
                          borderBottomLeftRadius: desktopDialog
                            ? designTokens.auth.dialogRadius
                            : 0,
                          borderBottomRightRadius: desktopDialog
                            ? designTokens.auth.dialogRadius
                            : 0,
                          backgroundColor: palette.canvas,
                          paddingTop: screen
                            ? designTokens.auth.screenPaddingTop
                            : 0,
                          paddingHorizontal: screen
                            ? designTokens.auth.screenPaddingX
                            : 0,
                          paddingBottom: screen
                            ? designTokens.auth.screenPaddingBottom
                            : 0,
                          zIndex: designTokens.layer.modal,
                          justifyContent: screen ? 'flex-start' : undefined,
                        }}
                      >
                        {screen ? (
                          <View
                            pointerEvents="none"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            style={{
                              position: 'absolute',
                              top:
                                designTokens.auth.markTop +
                                designTokens.auth.screenPaddingTop,
                              left: 0,
                              right: 0,
                              height: designTokens.auth.markSlotHeight,
                              alignItems: 'center',
                            }}
                          >
                            <View
                              style={{
                                width: designTokens.auth.markSlotWidth,
                                height: designTokens.auth.markSlotHeight,
                              }}
                            >
                              <View
                                style={{
                                  position: 'absolute',
                                  left: designTokens.auth.markInsetX,
                                  top: designTokens.auth.markInsetY,
                                }}
                              >
                                <BidplaceMark />
                              </View>
                            </View>
                          </View>
                        ) : null}
                        {screen ? (
                          <View
                            pointerEvents="none"
                            accessibilityElementsHidden
                            importantForAccessibility="no-hide-descendants"
                            style={{
                              position: 'absolute',
                              bottom:
                                designTokens.auth.wordmarkBottom +
                                designTokens.auth.screenPaddingBottom,
                              left: 0,
                              right: 0,
                              alignItems: 'center',
                            }}
                          >
                            <BidplaceWordmark />
                          </View>
                        ) : null}
                        {!screen && !desktopDialog ? (
                          <SheetDragHandle>
                            <View
                              testID="auth-sheet-handle"
                              style={{
                                paddingTop: designTokens.auth.paddingTop,
                                paddingBottom: designTokens.auth.titleGap,
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                height:
                                  designTokens.auth.paddingTop +
                                  designTokens.auth.handleSlot +
                                  designTokens.auth.titleGap,
                              }}
                            >
                              <View
                                aria-hidden
                                style={{
                                  width: designTokens.auth.handleWidth,
                                  height: designTokens.auth.handleHeight,
                                  borderRadius: designTokens.radius.pill,
                                  backgroundColor: palette.quietFill,
                                }}
                              />
                            </View>
                          </SheetDragHandle>
                        ) : null}
                        <ScrollView
                          ref={screen ? screenScrollRef : undefined}
                          keyboardShouldPersistTaps="handled"
                          keyboardDismissMode="on-drag"
                          showsVerticalScrollIndicator={false}
                          style={
                            screen
                              ? {
                                  flex: 1,
                                  marginTop: screenCentered
                                    ? 0
                                    : brandInset.markClearance,
                                  marginBottom: screenCentered
                                    ? 0
                                    : brandInset.wordmarkClearance,
                                }
                              : { flexShrink: 1, minHeight: 0 }
                          }
                          contentContainerStyle={{
                            paddingTop:
                              !screen && desktopDialog
                                ? designTokens.auth.paddingX
                                : 0,
                            paddingHorizontal: screen
                              ? 0
                              : designTokens.auth.paddingX,
                            paddingBottom: screen
                              ? 0
                              : Math.max(
                                  designTokens.auth.paddingBottom,
                                  insets.bottom,
                                ),
                            gap: screen ? 0 : contentGap,
                            flexGrow: screen ? 1 : undefined,
                            justifyContent:
                              screen && screenCentered ? 'center' : undefined,
                          }}
                        >
                          {screen ? (
                            <Dialog.Title asChild>
                              <AppText
                                role="sectionTitle"
                                style={{
                                  position: 'absolute',
                                  width: 1,
                                  height: 1,
                                  overflow: 'hidden',
                                }}
                              >
                                {title}
                              </AppText>
                            </Dialog.Title>
                          ) : (
                            <View
                              style={
                                desktopDialog
                                  ? {
                                      paddingTop: designTokens.space.x1 + 2,
                                      paddingBottom: designTokens.space.x3,
                                      paddingHorizontal:
                                        designTokens.auth.titleGap,
                                    }
                                  : undefined
                              }
                            >
                              <View
                                style={{
                                  minHeight: desktopDialog
                                    ? designTokens.size.icon + 2
                                    : designTokens.typography.authSheetTitle
                                        .lineHeight,
                                  justifyContent: 'center',
                                }}
                              >
                                <Dialog.Title asChild>
                                  <AppText
                                    role="sectionTitle"
                                    style={{
                                      color: palette.fieldValue,
                                      ...(desktopDialog
                                        ? designTokens.typography
                                            .authDialogTitle
                                        : designTokens.typography
                                            .authSheetTitle),
                                      paddingRight: desktopDialog
                                        ? designTokens.size.touch
                                        : 0,
                                    }}
                                  >
                                    {title}
                                  </AppText>
                                </Dialog.Title>
                                {desktopDialog ? (
                                  <MotionPressable
                                    accessibilityRole="button"
                                    accessibilityLabel="Закрыть"
                                    onPress={requestDismiss}
                                    preset="icon"
                                    style={{
                                      position: 'absolute',
                                      right: -designTokens.space.x2,
                                      width: designTokens.size.touch,
                                      height: designTokens.size.touch,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <FigmaIcon name="x" size={26} />
                                  </MotionPressable>
                                ) : null}
                              </View>
                            </View>
                          )}
                          <View
                            onLayout={(event) => {
                              if (!screen) return;
                              const next = event.nativeEvent.layout.height;
                              setScreenContentHeight((current) =>
                                current === next ? current : next,
                              );
                            }}
                            style={{
                              gap: screen ? 0 : formGap,
                              width: '100%',
                              // The sheet form fills the available inner width at
                              // <=600 viewports; fullscreen registration and the
                              // wide desktop sheet keep the measured 350 column.
                              maxWidth: screen ? 350 : undefined,
                              alignSelf: 'center',
                            }}
                          >
                            {children}
                          </View>
                        </ScrollView>
                        {!screen && !desktopDialog ? (
                          <MotionPressable
                            accessibilityRole="button"
                            accessibilityLabel="Закрыть"
                            onPress={requestDismiss}
                            preset="icon"
                            style={({ focused: closeFocused }) =>
                              closeFocused
                                ? {
                                    position: 'absolute',
                                    top: designTokens.auth.paddingTop,
                                    right: designTokens.auth.paddingX,
                                    width: designTokens.size.touch,
                                    height: designTokens.size.touch,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: palette.canvas,
                                    zIndex: designTokens.layer.modal,
                                  }
                                : {
                                    position: 'absolute',
                                    width: 1,
                                    height: 1,
                                    overflow: 'hidden',
                                    opacity: 0,
                                    pointerEvents: 'none',
                                  }
                            }
                          >
                            <FigmaIcon name="x" size={26} />
                          </MotionPressable>
                        ) : null}
                        {screen ? (
                          <MotionPressable
                            accessibilityRole="button"
                            accessibilityLabel="Закрыть"
                            onPress={requestDismiss}
                            preset="icon"
                            style={{
                              position: 'absolute',
                              top: designTokens.auth.screenPaddingTop,
                              right: designTokens.auth.screenPaddingX,
                              width: designTokens.size.touch,
                              height: designTokens.size.touch,
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: designTokens.layer.modal,
                            }}
                          >
                            <FigmaIcon name="x" size={22} />
                          </MotionPressable>
                        ) : null}
                      </Dialog.Content>
                    </SheetDragSurface>
                  </AppDialogSheetMotion>
                </View>
              </AppDialogFrame>
            </View>
          </Dialog.Portal>
        </Dialog.Root>
      </AuthSheetGuardProvider>
      {focused && exit ? (
        <AuthExitConfirm
          open={confirm}
          copy={exit}
          onLeave={commitLeave}
          onContinue={continueForm}
        />
      ) : null}
    </View>
  );
}
