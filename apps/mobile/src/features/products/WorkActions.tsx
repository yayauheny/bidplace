import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { BackButton } from '../../components/figma/BackButton';
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
      <BackButton surface="glass" onPress={onPress} />
    </View>
  );
}

export function WorkShareControl({
  onPress,
  open,
  onFavorite,
}: {
  onPress: () => void;
  open: boolean;
  onFavorite: () => void;
}) {
  return (
    <FigmaGlassSurface
      testID="work-share"
      preset="controlGroup"
      style={{ pointerEvents: 'auto', padding: 0, overflow: 'visible' }}
      contentStyle={{
        display: 'flex',
        flexDirection: 'row',
        gap: designTokens.space.x1 / 2,
      }}
    >
      <FigmaIconButton
        icon="heart"
        iconSize={20}
        size="navigation"
        surface="plain"
        label="В избранное"
        accessibilityHint="Избранное пока недоступно."
        onPress={onFavorite}
      />
      <FigmaIconButton
        icon="share-03"
        iconSize={20}
        size="navigation"
        surface={open ? 'active' : 'plain'}
        expanded={open}
        label="Поделиться работой"
        onPress={onPress}
      />
    </FigmaGlassSurface>
  );
}
