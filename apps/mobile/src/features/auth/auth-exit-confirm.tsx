import * as Dialog from '@rn-primitives/dialog';
import { useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { AppText } from '../../components/ui';
import { MotionPressable } from '../../components/ui/MotionPressable';
import { AppDialogFrame, AppDialogOverlay } from '../../components/ui/app-dialog-layer';

export type AuthExitCopy = {
  title: string;
  description: string;
};

export function AuthExitConfirm({
  open,
  copy,
  onLeave,
  onContinue,
}: {
  open: boolean;
  copy: AuthExitCopy;
  onLeave: () => void;
  onContinue: () => void;
}) {
  const { width } = useWindowDimensions();
  const gutter = designTokens.layout.mobileGutter;
  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onContinue(); }}>
      <Dialog.Portal>
        <AppDialogOverlay style={{ inset: 0, backgroundColor: designTokens.color.modalDimmer, zIndex: designTokens.layer.modal + 1 }} />
        <AppDialogFrame
          style={{
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: gutter,
            zIndex: designTokens.layer.modal + 1,
            pointerEvents: 'box-none',
          }}
        >
          <Dialog.Content
            nativeID="auth-exit-confirm"
            style={{
              width: '100%',
              maxWidth: Math.min(designTokens.layout.dialogMaxWidth, width - gutter * 2),
              borderRadius: designTokens.auth.exitRadius,
              backgroundColor: designTokens.color.dialogSurface,
              paddingTop: designTokens.auth.exitPaddingTop,
              paddingHorizontal: designTokens.auth.exitPaddingX,
              paddingBottom: designTokens.auth.exitPaddingBottom,
              gap: designTokens.auth.exitActionGap,
            }}
          >
            <View style={{ gap: designTokens.auth.exitTextGap, alignItems: 'center' }}>
              <Dialog.Title asChild>
                <AppText role="sectionTitle" style={{ textAlign: 'center', color: designTokens.color.fieldValue, ...designTokens.typography.sectionTitle, fontSize: 22, letterSpacing: -0.44 }}>
                  {copy.title}
                </AppText>
              </Dialog.Title>
              <Dialog.Description asChild>
                <AppText role="bodySmall" style={{ textAlign: 'center', color: designTokens.color.fieldValue, fontSize: 15, lineHeight: 20, letterSpacing: -0.3 }}>
                  {copy.description}
                </AppText>
              </Dialog.Description>
            </View>
            <View style={{ flexDirection: 'row', gap: designTokens.auth.exitActionsGap }}>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Прервать"
                onPress={onLeave}
                preset="primaryAction"
                style={{
                  flex: 1,
                  minHeight: designTokens.auth.exitActionHeight,
                  borderRadius: designTokens.radius.button,
                  borderWidth: designTokens.size.fieldBorder,
                  borderColor: designTokens.color.mutedFill,
                  backgroundColor: designTokens.color.mutedFill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText role="button" style={{ color: designTokens.color.textSubdued, ...designTokens.typography.authButton }}>
                  Прервать
                </AppText>
              </MotionPressable>
              <MotionPressable
                accessibilityRole="button"
                accessibilityLabel="Продолжить"
                onPress={onContinue}
                preset="primaryAction"
                style={{
                  flex: 1,
                  minHeight: designTokens.auth.exitActionHeight,
                  borderRadius: designTokens.radius.button,
                  borderWidth: designTokens.size.fieldBorder,
                  borderColor: designTokens.color.fieldValue,
                  backgroundColor: designTokens.color.fieldValue,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText role="button" style={{ color: designTokens.color.white, ...designTokens.typography.authButton }}>
                  Продолжить
                </AppText>
              </MotionPressable>
            </View>
          </Dialog.Content>
        </AppDialogFrame>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
