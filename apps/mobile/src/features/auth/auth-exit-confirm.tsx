import * as Dialog from '@rn-primitives/dialog';
import { useWindowDimensions, View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';

import { FigmaButton } from '../../components/figma/FigmaButton';
import { AppText } from '../../components/ui';
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
              <View style={{ flex: 1 }}>
                <FigmaButton
                  label="Прервать"
                  variant="muted"
                  width="full"
                  onPress={onLeave}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FigmaButton
                  label="Продолжить"
                  variant="solid"
                  width="full"
                  onPress={onContinue}
                />
              </View>
            </View>
          </Dialog.Content>
        </AppDialogFrame>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
