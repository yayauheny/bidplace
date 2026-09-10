import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { MotionPressable } from '../ui/MotionPressable';
import { FigmaChip } from './FigmaChip';
import { getWorkIdentityContent } from './work-identity';

export function WorkIdentityBlock({
  title,
  authorName,
  authorSlug,
  city,
  technique,
  materials,
}: {
  title: string;
  authorName: string;
  authorSlug: string;
  city?: string | null;
  technique?: string | null;
  materials?: string | null;
}) {
  const content = getWorkIdentityContent({
    title,
    authorName,
    authorSlug,
    city,
    technique,
    materials,
  });

  return (
    <View style={{ gap: figmaTokens.space.x4, width: '100%' }}>
      <View style={{ gap: figmaTokens.space.x2 }}>
        <Text
          style={[
            { color: figmaTokens.color.ink },
            figmaTokens.typography.sectionTitle,
          ]}
        >
          {content.title}
        </Text>
        <Link href={content.authorHref} asChild>
          <MotionPressable
            accessibilityRole="link"
            accessibilityLabel={`Открыть профиль автора ${content.authorName}`}
            preset="button"
          >
            <Text
              style={[
                { color: figmaTokens.color.ink },
                figmaTokens.typography.label,
              ]}
            >
              {content.authorName} · {content.handle}
            </Text>
          </MotionPressable>
        </Link>
      </View>
      {content.chips.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: figmaTokens.space.chipGap,
          }}
        >
          {content.chips.map((chip) => (
            <FigmaChip key={chip} label={chip} tone="onLight" />
          ))}
        </View>
      ) : null}
    </View>
  );
}
