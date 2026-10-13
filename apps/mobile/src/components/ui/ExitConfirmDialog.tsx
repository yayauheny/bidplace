import * as Dialog from '@rn-primitives/dialog';
import { useId } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton } from '../figma/FigmaButton';
import { AppText } from './AppText';
import { AppDialogFrame, AppDialogOverlay } from './app-dialog-layer';
import { useReturnFocus } from './use-return-focus';

export type ExitConfirmCopy = {
  title: string;
  description: string;
};

export function ExitConfirmDialog({
  open,
  dialogId = 'exit-confirm',
  copy,
  leaveLabel = 'Прервать',
  continueLabel = 'Продолжить',
  onLeave,
  onContinue,
  busy = false,
  continueDisabled = false,
  error,
  returnFocusRef,
}: {
  open: boolean;
  dialogId?: string;
  copy: ExitConfirmCopy;
  leaveLabel?: string;
  continueLabel?: string;
  onLeave: () => void;
  onContinue: () => void;
  busy?: boolean;
  continueDisabled?: boolean;
  error?: string;
  returnFocusRef?: { current: { focus?: () => void } | null };
}) {
  const errorId = useId();
  const { width } = useWindowDimensions();
  const gutter = designTokens.layout.mobileGutter;
  const blockDismiss = busy || continueDisabled;
  const returnFocus = useReturnFocus({ explicitRef: returnFocusRef });

  if (!open) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next || blockDismiss) return;
        onContinue();
      }}
    >
      <Dialog.Portal>
        <AppDialogOverlay
          style={{
            inset: 0,
            backgroundColor: designTokens.color.modalDimmer,
            zIndex: designTokens.layer.modal + 1,
          }}
        />
        <AppDialogFrame
          style={{
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: gutter,
            paddingVertical: gutter,
            zIndex: designTokens.layer.modal + 1,
            pointerEvents: 'box-none',
          }}
        >
          <Dialog.Content
            nativeID={dialogId}
            {...(Platform.OS === 'web' ? returnFocus : {})}
            style={{
              width: '100%',
              maxWidth: Math.min(
                designTokens.layout.dialogMaxWidth,
                width - gutter * 2,
              ),
              maxHeight: '100%',
              minWidth: 0,
              flexShrink: 1,
              ...(Platform.OS === 'web'
                ? { pointerEvents: 'auto' as const }
                : {}),
              borderRadius: designTokens.auth.exitRadius,
              backgroundColor: designTokens.color.dialogSurface,
              overflow: 'hidden',
            }}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{
                flexShrink: 1,
                minHeight: 0,
                minWidth: 0,
                width: '100%',
              }}
              contentContainerStyle={{
                paddingTop: designTokens.auth.exitPaddingTop,
                paddingHorizontal: designTokens.auth.exitPaddingX,
                paddingBottom: designTokens.auth.exitPaddingBottom,
                gap: designTokens.auth.exitActionGap,
                minWidth: 0,
              }}
            >
              <View
                style={{
                  gap: designTokens.auth.exitTextGap,
                  alignItems: 'center',
                  alignSelf: 'stretch',
                  minWidth: 0,
                }}
              >
                <Dialog.Title asChild>
                  <AppText
                    role="sectionTitle"
                    style={{
                      textAlign: 'center',
                      alignSelf: 'stretch',
                      minWidth: 0,
                      color: designTokens.color.fieldValue,
                      ...designTokens.typography.sectionTitle,
                      fontSize: 22,
                      lineHeight: 27,
                      letterSpacing: -0.44,
                    }}
                  >
                    {copy.title}
                  </AppText>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <AppText
                    role="bodySmall"
                    style={{
                      textAlign: 'center',
                      alignSelf: 'stretch',
                      minWidth: 0,
                      color: designTokens.color.fieldValue,
                      fontSize: 15,
                      lineHeight: 20,
                      letterSpacing: -0.3,
                    }}
                  >
                    {copy.description}
                  </AppText>
                </Dialog.Description>
              </View>
              {error ? (
                <AppText
                  nativeID={errorId}
                  role="bodySmall"
                  tone="danger"
                  accessibilityLiveRegion="polite"
                  style={{ textAlign: 'center' }}
                >
                  {error}
                </AppText>
              ) : null}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignSelf: 'stretch',
                  minWidth: 0,
                  gap: designTokens.auth.exitActionsGap,
                }}
              >
                <View
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    minWidth: designTokens.auth.exitConfirmActionMinWidth,
                    maxWidth: '100%',
                  }}
                >
                  <FigmaButton
                    label={leaveLabel}
                    variant="muted"
                    size="exitConfirm"
                    width="full"
                    disabled={busy}
                    onPress={onLeave}
                  />
                </View>
                <View
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    minWidth: designTokens.auth.exitConfirmActionMinWidth,
                    maxWidth: '100%',
                  }}
                >
                  <FigmaButton
                    label={continueLabel}
                    variant="solid"
                    size="exitConfirm"
                    width="full"
                    disabled={continueDisabled || busy}
                    loading={busy}
                    onPress={onContinue}
                  />
                </View>
              </View>
            </ScrollView>
          </Dialog.Content>
        </AppDialogFrame>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
