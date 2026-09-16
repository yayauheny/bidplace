import { Link } from 'expo-router';
import { View } from 'react-native';

import { designTokens } from '@bidplace/design-tokens';
import { AppText, MotionPressable } from '../../components/ui';
import { FigmaChip } from '../../components/figma/FigmaChip';
import { FigmaIcon } from '../../components/figma/FigmaIcon';
import type { WorkHeaderProps } from './work-header';

export function WorkIdentity({
  title,
  authorName,
  authorHref,
  chips,
}: Pick<WorkHeaderProps, 'title' | 'authorName' | 'authorHref' | 'chips'>) {
  return (
    <View testID="work-identity" style={{ gap: designTokens.space.x3 }}>
      <View style={{ gap: designTokens.space.x2 }}>
        <AppText role="workTitle" accessibilityRole="header">
          {title}
        </AppText>
        <Link href={authorHref} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={`Открыть профиль автора ${authorName}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.space.x1,
            }}
          >
            <AppText
              role="workAuthor"
              tone="subdued"
              style={{ flexShrink: 1 }}
            >
              {authorName}
            </AppText>
            <FigmaIcon
              name="arrow-right-01"
              color={designTokens.color.textSubdued}
            />
          </MotionPressable>
        </Link>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: designTokens.space.workChipGap,
        }}
      >
        {chips.map((chip) => (
          <FigmaChip key={chip} label={chip} tone="onGlass" size="work" />
        ))}
      </View>
    </View>
  );
}
