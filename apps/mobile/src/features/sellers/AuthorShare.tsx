import { useState } from 'react';
import { designTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../../components/ui';
import { ShareSheet } from '../../components/figma/ShareSheet';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { FigmaIcon } from '../../components/figma/FigmaIcon';

export function AuthorShare({ sharePath }: { sharePath: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FigmaGlassSurface
        preset="controlGroup"
        testID="author-share-group"
        contentStyle={{
          paddingLeft: designTokens.space.identityGap,
          paddingRight: designTokens.space.identityGap,
          paddingTop: designTokens.space.socialGroupY,
          paddingBottom: designTokens.space.socialGroupY,
        }}
      >
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Поделиться профилем"
          onPress={() => setOpen(true)}
          preset="icon"
          style={{
            width: designTokens.size.control,
            height: designTokens.size.control,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: designTokens.radius.pill,
          }}
        >
          <FigmaIcon name="share-04" size={designTokens.size.socialGroupIcon} />
        </MotionPressable>
      </FigmaGlassSurface>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        sharePath={sharePath}
      />
    </>
  );
}
