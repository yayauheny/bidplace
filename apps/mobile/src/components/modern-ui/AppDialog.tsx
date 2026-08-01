import * as Dialog from '@rn-primitives/dialog';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { modernTokens } from '@bidplace/design-tokens';

import { AppText } from './AppText';

type AppDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AppDialog({
  open,
  title,
  description,
  onClose,
  children,
}: AppDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          closeOnPress
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: modernTokens.color.overlay,
          }}
        />
        <View
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: modernTokens.space.x5,
          }}
          pointerEvents="box-none"
        >
          <Dialog.Content
            style={{
              width: '100%',
              maxWidth: 520,
              gap: modernTokens.space.x4,
              borderRadius: modernTokens.radius.panel,
              backgroundColor: modernTokens.color.surface,
              padding: modernTokens.space.x5,
            }}
          >
            <Dialog.Title asChild>
              <AppText role="sectionTitle">{title}</AppText>
            </Dialog.Title>
            {description ? (
              <Dialog.Description asChild>
                <AppText role="bodySmall" tone="secondary">
                  {description}
                </AppText>
              </Dialog.Description>
            ) : null}
            <View style={{ gap: modernTokens.space.x3 }}>{children}</View>
          </Dialog.Content>
        </View>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
