import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { visibleWorkStory } from './work-story';

export function WorkStory({ story }: { story?: string | null }) {
  const body = visibleWorkStory(story);
  if (!body) return null;

  return (
    <View nativeID="work-panel-story" style={{ gap: figmaTokens.space.x2 }}>
      <Text
        style={[
          { color: figmaTokens.color.ink },
          figmaTokens.typography.body,
        ]}
      >
        {body}
      </Text>
    </View>
  );
}
