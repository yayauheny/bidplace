import * as Dialog from '@rn-primitives/dialog';
import { useIsFocused, useNavigation, useRouter, type Href } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';

import { HomeScreen } from '../../features/home/home-screen';
import {
  AUTH_BROWSER_BACK_STEPS,
  authHistoryGuardState,
  authLeaveCommit,
  authLeaveDestination,
  authNavigationDismissal,
  authNavigationTarget,
  isAuthHistoryGuard,
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
import { AppText } from '../ui';
import { AppIcon } from '../ui/AppIcon';
import { AppDialogFrame, AppDialogOverlay } from '../ui/app-dialog-layer';
import { appDialogHostStyle } from '../ui/app-dialog-host-style';
import { MotionPressable } from '../ui/MotionPressable';

type NavigationAction = {
  type?: string;
  payload?: { name?: string; params?: { screen?: string } };
};

export function AuthViewport({
  title,
  children,
  redirectTo = '/',
  tone = 'login',
  exit,
}: {
  title: string;
  children: ReactNode;
  redirectTo?: SafeRedirect;
  tone?: 'login' | 'section';
  exit: AuthExitCopy;
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const focused = useIsFocused();
  const historyGuardId = useId();
  const { height, width } = useWindowDimensions();
  const [guard, setGuard] = useState<AuthSheetGuard>({ dirty: false, busy: false });
  const [confirm, setConfirm] = useState(false);
  const [released, setReleased] = useState(false);
  const pendingAction = useRef<NavigationAction | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const releasedRef = useRef(false);
  const browserBackRef = useRef(false);
  const sentinelRef = useRef(false);
  const completionRef = useRef<SafeRedirect | null>(null);
  const focusedRef = useRef(focused);
  const guardRef = useRef(guard);
  focusedRef.current = focused;
  guardRef.current = guard;

  const onGuard = useCallback((next: AuthSheetGuard) => {
    setGuard((current) =>
      current.dirty === next.dirty && current.busy === next.busy ? current : next,
    );
  }, []);
  const destination = authLeaveDestination(redirectTo);

  const rememberFocus = useCallback(() => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) returnFocus.current = active;
  }, []);

  const openConfirm = useCallback(() => {
    rememberFocus();
    setConfirm(true);
  }, [rememberFocus]);

  const complete = useCallback((next: SafeRedirect) => {
    if (!focusedRef.current || completionRef.current || releasedRef.current) return;
    completionRef.current = next;
    releasedRef.current = true;
    setReleased(true);
    setConfirm(false);
    router.replace(next as Href);
  }, [router]);

  const commitLeave = useCallback(() => {
    if (releasedRef.current) return;
    const action = pendingAction.current;
    pendingAction.current = null;
    const browserBack = browserBackRef.current;
    browserBackRef.current = false;
    releasedRef.current = true;
    setReleased(true);
    setConfirm(false);
    const commit = authLeaveCommit({
      hasNavigationAction: action !== null,
      browserBack,
    });
    if (commit === 'dispatch' && action) {
      navigation.dispatch(action as never);
      return;
    }
    if (commit === 'history' && typeof window !== 'undefined') {
      window.history.go(AUTH_BROWSER_BACK_STEPS);
      return;
    }
    router.replace(destination as Href);
  }, [destination, navigation, router]);

  const requestDismiss = useCallback(() => {
    if (!focusedRef.current || releasedRef.current) return;
    const decision = authNavigationDismissal({
      dirty: guardRef.current.dirty,
      busy: guardRef.current.busy,
      targetRoute: undefined,
      released: false,
    });
    browserBackRef.current = false;
    pendingAction.current = null;
    if (decision === 'keep') return;
    if (decision === 'allow') {
      commitLeave();
      return;
    }
    openConfirm();
  }, [commitLeave, openConfirm]);

  usePreventRemove(focused && (guard.dirty || guard.busy) && !released, ({ data }) => {
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
      targetRoute: authNavigationTarget(action),
      released: false,
    });
    if (decision === 'allow') {
      navigation.dispatch(data.action);
      return;
    }
    if (decision === 'keep') return;
    pendingAction.current = action;
    browserBackRef.current = false;
    openConfirm();
  });

  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !focused) return;
    if (releasedRef.current) return;
    if (!guard.dirty && !guard.busy) return;
    if (!sentinelRef.current) {
      window.history.pushState(
        authHistoryGuardState(window.history.state, historyGuardId),
        '',
        window.location.href,
      );
      sentinelRef.current = true;
    }
    const onPopState = (event: PopStateEvent) => {
      if (releasedRef.current || completionRef.current) return;
      if (isAuthHistoryGuard(event.state, historyGuardId)) return;
      event.stopImmediatePropagation();
      browserBackRef.current = true;
      pendingAction.current = null;
      window.history.go(1);
      if (guardRef.current.busy) return;
      openConfirm();
    };
    window.addEventListener('popstate', onPopState, true);
    return () => window.removeEventListener('popstate', onPopState, true);
  }, [focused, guard.busy, guard.dirty, historyGuardId, openConfirm]);

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
    browserBackRef.current = false;
    setConfirm(false);
    const element = returnFocus.current;
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        if (element?.isConnected) element.focus();
      });
    }
  };

  const entering = useMemo(() => sheetEnter(() => undefined), []);
  const contentGap = tone === 'login' ? designTokens.auth.loginGap : designTokens.auth.sectionGap;
  const formGap = tone === 'login' ? designTokens.auth.loginFormGap : designTokens.auth.formGap;
  const frameStyle = appDialogHostStyle({
    presentation: 'sheet',
    width,
    viewportGutter: designTokens.space.x5,
  });

  return (
    <View style={{ flex: 1, backgroundColor: designTokens.color.canvas }}>
      {focused ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          {...(Platform.OS === 'web' ? { inert: true } : {})}
        >
          <HomeScreen />
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
              <Animated.View entering={sheetBackdropEnter} exiting={sheetBackdropExit}>
                <AppDialogOverlay
                  style={{
                    inset: 0,
                    backgroundColor: designTokens.color.modalDimmer,
                    zIndex: designTokens.layer.modal,
                  }}
                />
              </Animated.View>
              <AppDialogFrame style={frameStyle}>
                <Animated.View entering={entering} exiting={sheetExit} style={{ width: '100%' }}>
                  <Dialog.Content
                    forceMount={Platform.OS === 'web' ? true : undefined}
                    nativeID={focused ? 'auth-sheet' : undefined}
                    aria-modal={focused}
                    style={{
                      width: '100%',
                      maxWidth: designTokens.layout.phoneWidth,
                      maxHeight: Math.max(height - designTokens.space.x6, designTokens.size.input * 4),
                      overflow: 'hidden',
                      borderTopLeftRadius: designTokens.auth.sheetRadius,
                      borderTopRightRadius: designTokens.auth.sheetRadius,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      backgroundColor: designTokens.color.dialogSurface,
                      paddingTop: designTokens.auth.paddingTop,
                      paddingHorizontal: designTokens.auth.paddingX,
                      paddingBottom: designTokens.auth.paddingBottom,
                      zIndex: designTokens.layer.modal,
                    }}
                  >
                    <ScrollView
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: Math.max(height - designTokens.space.x6 - designTokens.auth.paddingTop - designTokens.auth.paddingBottom, designTokens.size.input * 4) }}
                      contentContainerStyle={{ gap: contentGap }}
                    >
                      <View style={{ minHeight: designTokens.auth.headerHeight, gap: designTokens.auth.titleGap }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.space.x2 }}>
                          <Dialog.Title asChild>
                            <AppText role="sectionTitle" style={{ flex: 1, color: designTokens.color.fieldValue, ...designTokens.typography.authSheetTitle }}>
                              {title}
                            </AppText>
                          </Dialog.Title>
                          <MotionPressable
                            accessibilityRole="button"
                            accessibilityLabel="Закрыть"
                            onPress={requestDismiss}
                            preset="icon"
                            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <AppIcon name="x" size={22} />
                          </MotionPressable>
                        </View>
                      </View>
                      <View style={{ gap: formGap }}>{children}</View>
                    </ScrollView>
                  </Dialog.Content>
                </Animated.View>
              </AppDialogFrame>
            </View>
          </Dialog.Portal>
        </Dialog.Root>
      </AuthSheetGuardProvider>
      {focused ? (
        <AuthExitConfirm open={confirm} copy={exit} onLeave={commitLeave} onContinue={continueForm} />
      ) : null}
    </View>
  );
}
