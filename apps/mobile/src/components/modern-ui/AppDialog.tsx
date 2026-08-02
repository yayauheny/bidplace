import * as Dialog from '@rn-primitives/dialog';
import type { ReactNode } from 'react';
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native';

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
  const { height } = useWindowDimensions();
  const viewportGutter = modernTokens.space.x5;

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
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            inset: 0,
            backgroundColor: modernTokens.color.overlay,
            zIndex: modernTokens.layer.modal,
          }}
        />
        <View
          style={{
            position: Platform.OS === 'web' ? 'fixed' : 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: viewportGutter,
            zIndex: modernTokens.layer.modal,
          }}
          pointerEvents="box-none"
        >
          <Dialog.Content
            style={{
              width: '100%',
              maxWidth: 520,
              maxHeight: Math.max(height - viewportGutter * 2, 0),
              gap: modernTokens.space.x4,
              borderRadius: modernTokens.radius.panel,
              backgroundColor: modernTokens.color.surface,
              padding: modernTokens.space.x5,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerStyle={{
                gap: modernTokens.space.x4,
                paddingBottom: modernTokens.space.x1,
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
            </ScrollView>
          </Dialog.Content>
        </View>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
