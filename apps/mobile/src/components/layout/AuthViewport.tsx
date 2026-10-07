import * as Dialog from '@rn-primitives/dialog';
import { useNavigation, useRouter, type Href } from 'expo-router';
import { usePreventRemove } from 'expo-router/build/react-navigation/core';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { designTokens } from '@bidplace/design-tokens';

import { HomeScreen } from '../../features/home/home-screen';
import {
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
  const { height, width } = useWindowDimensions();
  const [guard, setGuard] = useState<AuthSheetGuard>({ dirty: false, busy: false });
  const [confirm, setConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pendingAction = useRef<NavigationAction | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onGuard = useCallback((next: AuthSheetGuard) => {
    setGuard((current) =>
      current.dirty === next.dirty && current.busy === next.busy ? current : next,
    );
  }, []);
  const destination = authLeaveDestination(redirectTo);

  const openConfirm = useCallback(() => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
    setConfirm(true);
  }, []);

  const requestDismiss = useCallback(() => {
    const decision = authNavigationDismissal({
      dirty: guard.dirty,
      busy: guard.busy,
      targetRoute: undefined,
    });
    if (decision === 'keep') return;
    if (decision === 'allow') {
      setLeaving(true);
      return;
    }
    openConfirm();
  }, [guard.busy, guard.dirty, openConfirm]);

  usePreventRemove((guard.dirty || guard.busy) && !leaving, ({ data }) => {
    const action = data.action as NavigationAction;
    const decision = authNavigationDismissal({
      dirty: guard.dirty,
      busy: guard.busy,
      targetRoute: authNavigationTarget(action),
    });
    if (decision === 'allow') {
      navigation.dispatch(data.action);
      return;
    }
    if (decision === 'keep') return;
    pendingAction.current = action;
    openConfirm();
  });

  const continueForm = () => {
    pendingAction.current = null;
    setConfirm(false);
    const element = returnFocus.current;
    returnFocus.current = null;
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        if (element?.isConnected) element.focus();
      });
    }
  };

  const leave = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    setConfirm(false);
    setLeaving(true);
    if (action) {
      navigation.dispatch(action as never);
      return;
    }
    router.replace(destination as Href);
  };

  useEffect(() => {
    if (!leaving || pendingAction.current) return;
    router.replace(destination as Href);
  }, [destination, leaving, router]);

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
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        {...(Platform.OS === 'web' ? { inert: true } : {})}
      >
        <HomeScreen />
      </View>
      <AuthSheetGuardProvider onChange={onGuard}>
        <Dialog.Root
          open
          onOpenChange={(next) => {
            if (!next) requestDismiss();
          }}
        >
          <Dialog.Portal>
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
                  nativeID="auth-sheet"
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
          </Dialog.Portal>
        </Dialog.Root>
      </AuthSheetGuardProvider>
      <AuthExitConfirm open={confirm} copy={exit} onLeave={leave} onContinue={continueForm} />
    </View>
  );
}
