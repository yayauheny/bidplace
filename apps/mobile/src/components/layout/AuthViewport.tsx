import * as Dialog from '@rn-primitives/dialog';
import { useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';

import { HomeScreen } from '../../features/home/home-screen';
import {
  clearAuthHistory,
  publishAuthHistory,
} from '../../features/auth/auth-browser-history';
import {
  authBrowserLeaveTarget,
  authLeaveCommit,
  authLeaveDestination,
  authNavigationDismissal,
  authNavigationTarget,
} from '../../features/auth/auth-dismissal';
import { AuthExitConfirm, type AuthExitCopy } from '../../features/auth/auth-exit-confirm';
import {
  AuthSheetGuardProvider,
  type AuthSheetGuard,
} from '../../features/auth/auth-sheet-context';
import type { SafeRedirect } from '../../features/auth/auth-redirect';
import {
  sheetBackdropEnter,
  sheetBackdropExit,
  sheetEnter,
  sheetExit,
} from '../../lib/layout-transition';
import { BidplaceMark, BidplaceWordmark } from '../branding/BidplaceBrand';
import { AppText } from '../ui';
import { FigmaIcon } from '../figma/FigmaIcon';
import { AppDialogFrame, AppDialogOverlay } from '../ui/app-dialog-layer';
import { appDialogHostStyle } from '../ui/app-dialog-host-style';
import { MotionPressable } from '../ui/MotionPressable';

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
  redirectTo?: SafeRedirect;
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
    redirectTo = '/',
    tone = 'login',
    presentation = 'sheet',
  } = props;
  const protectEnteredData = props.protectEnteredData === true;
  const exit = protectEnteredData ? props.exit : undefined;
  const router = useRouter();
  const navigation = useNavigation();
  const focused = useIsFocused();
  const historyId = useId();
  const { height } = useWindowDimensions();
  const [screenContentHeight, setScreenContentHeight] = useState(0);
  const [guard, setGuard] = useState<AuthSheetGuard>({ dirty: false, busy: false });
  const [confirm, setConfirm] = useState(false);
  const [released, setReleased] = useState(false);
  const screenScrollRef = useRef<ScrollView>(null);
  const pendingAction = useRef<NavigationAction | null>(null);
  const browserLeavePath = useRef<string | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const releasedRef = useRef(false);
  const completionRef = useRef<SafeRedirect | null>(null);
  const focusedRef = useRef(focused);
  const guardRef = useRef(guard);
  const protectEnteredDataRef = useRef(protectEnteredData);
  focusedRef.current = focused;
  guardRef.current = guard;
  protectEnteredDataRef.current = protectEnteredData;

  const onGuard = useCallback((next: AuthSheetGuard) => {
    setGuard((current) =>
      current.dirty === next.dirty && current.busy === next.busy ? current : next,
    );
  }, []);
  const destination = authLeaveDestination(redirectTo);

  const openConfirm = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
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
        rememberLeave: (path) => {
          browserLeavePath.current = path;
          pendingAction.current = null;
        },
      });
    } else {
      clearAuthHistory(historyId);
    }
  }

  const complete = useCallback((next: SafeRedirect) => {
    if (!focusedRef.current || completionRef.current || releasedRef.current) return;
    completionRef.current = next;
    releasedRef.current = true;
    browserLeavePath.current = null;
    pendingAction.current = null;
    setReleased(true);
    setConfirm(false);
    router.replace(next as Href);
  }, [router]);

  const commitLeave = useCallback(() => {
    if (releasedRef.current) return;
    const action = pendingAction.current;
    const left = browserLeavePath.current;
    pendingAction.current = null;
    browserLeavePath.current = null;
    releasedRef.current = true;
    setReleased(true);
    setConfirm(false);
    const commit = authLeaveCommit({ hasNavigationAction: action !== null });
    if (commit === 'dispatch' && action) {
      navigation.dispatch(action as never);
      return;
    }
    router.replace((left ? authBrowserLeaveTarget(left) : destination) as Href);
  }, [destination, navigation, router]);

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
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !focused) return;
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('#auth-sheet')) returnFocus.current = target;
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [focused]);

  const continueForm = () => {
    pendingAction.current = null;
    browserLeavePath.current = null;
    setConfirm(false);
    const element = returnFocus.current;
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        if (element?.isConnected) element.focus();
      });
    }
  };

  const entering = useMemo(() => sheetEnter(() => undefined), []);
  const screen = presentation === 'screen';
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
    : tone === 'login'
      ? designTokens.auth.loginGap
      : designTokens.auth.sectionGap;
  const formGap = tone === 'login' ? designTokens.auth.loginFormGap : designTokens.auth.formGap;
  const frameStyle = appDialogHostStyle({
    presentation: 'sheet',
    viewportGutter: designTokens.space.x5,
  });

  return (
    <View style={{ flex: 1, backgroundColor: designTokens.color.canvas }}>
      {focused && !screen ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          {...(Platform.OS === 'web' ? { inert: true } : {})}
        >
          <HomeScreen hideDock />
        </View>
      ) : null}
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
              importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
              style={
                focused
                  ? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }
                  : { display: 'none' }
              }
              {...(Platform.OS === 'web' && !focused ? { inert: true } : {})}
            >
              {screen ? null : (
                <Animated.View entering={sheetBackdropEnter} exiting={sheetBackdropExit}>
                  <AppDialogOverlay
                    style={{
                      inset: 0,
                      backgroundColor: designTokens.color.modalDimmer,
                      zIndex: designTokens.layer.modal,
                    }}
                  />
                </Animated.View>
              )}
              <AppDialogFrame style={frameStyle}>
                <Animated.View entering={entering} exiting={sheetExit} style={{ width: '100%' }}>
                  <Dialog.Content
                    forceMount={Platform.OS === 'web' ? true : undefined}
                    nativeID={focused ? 'auth-sheet' : undefined}
                    aria-modal={focused}
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: designTokens.layout.sheetMax,
                      maxHeight: screen ? height : Math.max(height - designTokens.space.x6, designTokens.size.input * 4),
                      minHeight: screen ? height : undefined,
                      overflow: 'hidden',
                      borderTopLeftRadius: screen ? 0 : designTokens.auth.sheetRadius,
                      borderTopRightRadius: screen ? 0 : designTokens.auth.sheetRadius,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      backgroundColor: designTokens.color.canvas,
                      paddingTop: screen ? designTokens.auth.screenPaddingTop : designTokens.auth.paddingTop,
                      paddingHorizontal: screen ? designTokens.auth.screenPaddingX : designTokens.auth.paddingX,
                      paddingBottom: screen ? designTokens.auth.screenPaddingBottom : designTokens.auth.paddingBottom,
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
                          top: designTokens.auth.markTop + designTokens.auth.screenPaddingTop,
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
                          bottom: designTokens.auth.wordmarkBottom + designTokens.auth.screenPaddingBottom,
                          left: 0,
                          right: 0,
                          alignItems: 'center',
                        }}
                      >
                        <BidplaceWordmark />
                      </View>
                    ) : null}
                    <ScrollView
                      ref={screen ? screenScrollRef : undefined}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator={false}
                      style={screen ? {
                        flex: 1,
                        marginTop: screenCentered ? 0 : brandInset.markClearance,
                        marginBottom: screenCentered ? 0 : brandInset.wordmarkClearance,
                      } : { maxHeight: Math.max(height - designTokens.space.x6 - designTokens.auth.paddingTop - designTokens.auth.paddingBottom, designTokens.size.input * 4) }}
                      contentContainerStyle={{
                        gap: screen ? 0 : contentGap,
                        flexGrow: screen ? 1 : undefined,
                        justifyContent: screen && screenCentered ? 'center' : undefined,
                      }}
                    >
                      {screen ? (
                        <Dialog.Title asChild>
                          <AppText role="sectionTitle" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
                            {title}
                          </AppText>
                        </Dialog.Title>
                      ) : (
                        <View style={{ height: designTokens.auth.headerHeight, gap: designTokens.auth.titleGap }}>
                          <View style={{ height: designTokens.auth.handleSlot, alignItems: 'center', justifyContent: 'center' }}>
                            <View
                              accessibilityElementsHidden
                              importantForAccessibility="no"
                              style={{
                                width: designTokens.auth.handleWidth,
                                height: designTokens.auth.handleHeight,
                                borderRadius: designTokens.radius.pill,
                                backgroundColor: designTokens.color.quietFill,
                              }}
                            />
                          </View>
                          <View style={{ height: designTokens.typography.authSheetTitle.lineHeight, justifyContent: 'center' }}>
                            <Dialog.Title asChild>
                              <AppText role="sectionTitle" style={{ color: designTokens.color.fieldValue, ...designTokens.typography.authSheetTitle, paddingRight: 36 }}>
                                {title}
                              </AppText>
                            </Dialog.Title>
                            <MotionPressable
                              accessibilityRole="button"
                              accessibilityLabel="Закрыть"
                              onPress={requestDismiss}
                              preset="icon"
                              style={{ position: 'absolute', right: 0, top: (designTokens.typography.authSheetTitle.lineHeight - 32) / 2, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FigmaIcon name="x" size={22} />
                            </MotionPressable>
                          </View>
                        </View>
                      )}
                      <View
                        onLayout={(event) => {
                          if (!screen) return;
                          const next = event.nativeEvent.layout.height;
                          setScreenContentHeight((current) => (current === next ? current : next));
                        }}
                        style={{ gap: screen ? 0 : formGap, width: '100%', maxWidth: 350, alignSelf: 'center' }}
                      >
                        {children}
                      </View>
                    </ScrollView>
                  </Dialog.Content>
                </Animated.View>
              </AppDialogFrame>
            </View>
          </Dialog.Portal>
        </Dialog.Root>
      </AuthSheetGuardProvider>
      {focused && exit ? (
        <AuthExitConfirm open={confirm} copy={exit} onLeave={commitLeave} onContinue={continueForm} />
      ) : null}
    </View>
  );
}
