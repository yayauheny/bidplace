import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { AppText } from '../ui';
export function WorkFactsList({
  facts,
}: {
  facts: readonly { label: string; value: string }[];
}) {
  return (
    <View style={{ gap: designTokens.space.sectionGap }}>
      {facts.map((fact) => (
        <View key={fact.label}>
          <AppText
            role="bodySmall"
            style={{ fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}
          >
            {fact.label}
          </AppText>
          <AppText role="bodySmall">{fact.value}</AppText>
        </View>
      ))}
    </View>
  );
}
