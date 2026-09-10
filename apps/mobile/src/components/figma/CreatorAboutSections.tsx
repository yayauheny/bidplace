import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { visibleCreatorAboutSections } from './creator-about-sections';

export function CreatorAboutSections({
  biography,
  practice,
}: {
  biography?: string | null;
  practice?: string | null;
}) {
  const sections = visibleCreatorAboutSections({ biography, practice });
  if (sections.length === 0) return null;

  return (
    <View style={{ gap: figmaTokens.space.sectionGap, width: '100%' }}>
      {sections.map((section) => (
        <View key={section.id} style={{ gap: figmaTokens.space.x2 }}>
          <Text
            style={[
              { color: figmaTokens.color.ink },
              figmaTokens.typography.label,
            ]}
          >
            {section.title}
          </Text>
          <Text
            style={[
              { color: figmaTokens.color.ink },
              figmaTokens.typography.body,
            ]}
          >
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}
