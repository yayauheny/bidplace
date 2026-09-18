import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';

export function WorkBackControl({
  onPress,
  testID = 'work-back',
}: {
  onPress: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ pointerEvents: 'auto' }}>
      <FigmaGlassSurface
        preset="controlGroup"
        contentStyle={{ padding: designTokens.space.socialGroupY }}
      >
        <FigmaIconButton
          icon="arrow-left-01"
          iconSize={designTokens.size.socialGroupIcon}
          label="Назад"
          onPress={onPress}
        />
      </FigmaGlassSurface>
    </View>
  );
}

export function WorkShareControl({ onPress }: { onPress: () => void }) {
  return (
    <View testID="work-share" style={{ pointerEvents: 'auto' }}>
      <FigmaGlassSurface
        preset="controlGroup"
        contentStyle={{ padding: designTokens.space.socialGroupY }}
      >
        <FigmaIconButton
          icon="share-04"
          iconSize={designTokens.size.socialGroupIcon}
          label="Поделиться работой"
          onPress={onPress}
        />
      </FigmaGlassSurface>
    </View>
  );
}
