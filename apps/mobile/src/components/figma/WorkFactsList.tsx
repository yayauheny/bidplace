import { Text, View } from 'react-native';

import { figmaTokens } from '@bidplace/design-tokens';

import { visibleWorkFacts } from './work-facts';

export function WorkFactsList({
  technique,
  materials,
  dimensions,
  year,
  city,
}: {
  technique?: string | null;
  materials?: string | null;
  dimensions?: string | null;
  year?: number | null;
  city?: string | null;
}) {
  const facts = visibleWorkFacts({
    technique,
    materials,
    dimensions,
    year,
    city,
  });
  if (facts.length === 0) return null;

  return (
    <View
      nativeID="work-panel-details"
      style={{ gap: figmaTokens.space.x3, width: '100%' }}
    >
      {facts.map((fact) => (
        <View key={fact.label} style={{ gap: 2 }}>
          <Text
            style={[
              { color: figmaTokens.color.textSecondary },
              figmaTokens.typography.caption,
            ]}
          >
            {fact.label}
          </Text>
          <Text
            style={[
              { color: figmaTokens.color.ink },
              figmaTokens.typography.label,
            ]}
          >
            {fact.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
