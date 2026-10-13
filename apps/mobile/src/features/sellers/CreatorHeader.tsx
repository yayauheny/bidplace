import { View } from 'react-native';
import { designTokens } from '@bidplace/design-tokens';

import { FigmaIconButton } from '../../components/figma/FigmaIconButton';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { AuthorShare } from './AuthorShare';
import { CreatorIdentity } from './CreatorIdentity';
import type { CreatorHeaderProps } from './creator-header';

export function CreatorHeader({
  profile,
  onBack,
  tabs,
  tab,
  onTabChange,
  panelId,
}: CreatorHeaderProps) {
  return (
    <View testID="creator-static-header">
      <View testID="author-header" style={{ paddingTop: designTokens.space.x3 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: designTokens.space.pageGutter,
            marginBottom: designTokens.space.x5,
          }}
        >
          <View
            testID="author-back"
            style={{
              width: 42,
              height: 42,
              borderRadius: designTokens.radius.pill,
              backgroundColor: designTokens.color.headerControl,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FigmaIconButton icon="arrow-left-01" label="Назад" onPress={onBack} />
          </View>
          <AuthorShare sharePath={profile.sharePath} />
        </View>
        <CreatorIdentity profile={profile} />
      </View>
      <FigmaTabs
        tabs={tabs}
        value={tab}
        onChange={onTabChange}
        label="Профиль автора"
        panelId={panelId}
        align="center"
      />
    </View>
  );
}
