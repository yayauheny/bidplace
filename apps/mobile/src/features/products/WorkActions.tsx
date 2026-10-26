import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';
import { BackButton } from '../../components/figma/BackButton';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';

// Figma526:11497; non-overlapping49px targets keep the36px slots at x10/x52.
const workActionGeometry = {
  targetWidth: 49,
  opticalInset: 7,
  icon: 28,
  stroke: 1.75,
};

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
        gap: 0,
      }}
    >
      <FigmaIconButton
        icon="heart"
        iconSize={workActionGeometry.icon}
        strokeWidthPx={workActionGeometry.stroke}
        iconContainerStyle={{ padding: designTokens.space.x1 }}
        size="navigation"
        surface="plain"
        style={{
          width: workActionGeometry.targetWidth,
          paddingLeft: workActionGeometry.opticalInset,
        }}
        label="В избранное"
        accessibilityHint="Избранное пока недоступно."
        onPress={onFavorite}
      />
      <FigmaIconButton
        icon="share-03"
        iconSize={workActionGeometry.icon}
        strokeWidthPx={workActionGeometry.stroke}
        iconContainerStyle={{ padding: designTokens.space.x1 }}
        size="navigation"
        surface={open ? 'active' : 'plain'}
        expanded={open}
        style={{
          width: workActionGeometry.targetWidth,
          paddingRight: workActionGeometry.opticalInset,
        }}
        label="Поделиться работой"
        onPress={onPress}
      />
    </FigmaGlassSurface>
  );
}
