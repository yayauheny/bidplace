import { useState } from 'react';
import { Alert, Platform, Share, View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { publicShareTarget } from '../../components/figma/public-share';

export function AuthorShare({ sharePath }: { sharePath: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View
        testID="author-share-group"
        style={{
          width: 42,
          height: 42,
          borderRadius: designTokens.radius.pill,
          backgroundColor: designTokens.color.headerControl,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FigmaIconButton
          icon="share-04"
          label="Поделиться профилем"
          onPress={() => {
            if (Platform.OS === 'web') {
              setOpen(true);
              return;
            }
            // shortcut: native builds share the production site; update for separate staging app origins.
            const url = publicShareTarget(sharePath, 'https://bid.place').url;
            void Share.share({ message: url }).catch(() => {
              Alert.alert('Не удалось поделиться профилем');
            });
          }}
        />
      </View>
      {Platform.OS === 'web' ? (
        <ShareSheet
          open={open}
          onClose={() => setOpen(false)}
          sharePath={sharePath}
        />
      ) : null}
    </>
  );
}
