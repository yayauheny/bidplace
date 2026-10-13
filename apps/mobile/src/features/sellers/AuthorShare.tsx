import { useState } from 'react';
import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { ShareSheet } from '../../components/figma/ShareSheet';

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
          onPress={() => setOpen(true)}
        />
      </View>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        sharePath={sharePath}
      />
    </>
  );
}
