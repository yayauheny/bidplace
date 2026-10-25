import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { BackButton } from '../../components/figma/BackButton';
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
    <View
      testID="work-share"
      style={{
        pointerEvents: 'auto',
        flexDirection: 'row',
        gap: designTokens.space.x1 / 2,
      }}
    >
      <FigmaIconButton
        icon="heart"
        iconSize={20}
        size="navigation"
        surface="glass"
        label="В избранное"
        accessibilityHint="Избранное пока недоступно."
        onPress={onFavorite}
      />
      <FigmaIconButton
        icon="share-03"
        iconSize={20}
        size="navigation"
        surface={open ? 'active' : 'glass'}
        expanded={open}
        label="Поделиться работой"
        onPress={onPress}
      />
    </View>
  );
}
