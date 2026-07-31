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
        <Dialog.Content
          style={{
            position: 'absolute',
            left: modernTokens.space.x5,
            right: modernTokens.space.x5,
            top: '30%',
            maxWidth: 520,
            alignSelf: 'center',
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
      </Dialog.Portal>
    </Dialog.Root>
  );
}
