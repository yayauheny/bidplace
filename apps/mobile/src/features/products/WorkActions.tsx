import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { designTokens } from '@bidplace/design-tokens';
import { FigmaGlassSurface } from '../../components/figma/FigmaGlassSurface';
import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import {
  controlEnterFromAbove,
  controlExitUp,
} from '../../lib/layout-transition';
import { WEB_COMPACT_STACK } from '../../lib/sticky-handoff';

export function WorkBackControl({ onPress }: { onPress: () => void }) {
  return (
    <View testID="work-back">
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
    <View testID="work-share">
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

export function WorkCompactNav({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare: () => void;
}) {
  return (
    <Animated.View
      testID="work-compact-nav"
      entering={controlEnterFromAbove}
      exiting={controlExitUp}
      style={{
        height: WEB_COMPACT_STACK,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: designTokens.space.x3,
        paddingBottom: designTokens.space.x5,
        paddingHorizontal: designTokens.space.x5,
        backgroundColor: designTokens.color.canvas,
      }}
    >
      <WorkBackControl onPress={onBack} />
      <WorkShareControl onPress={onShare} />
    </Animated.View>
  );
}
