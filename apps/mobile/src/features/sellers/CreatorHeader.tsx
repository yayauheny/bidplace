import { View } from 'react-native';
import { FigmaTabs } from '../../components/figma/FigmaTabs';
import { WorkBackControl } from '../products/WorkActions';
import { CreatorHero } from './CreatorHero';
import { AuthorShare } from './AuthorShare';
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
    <View>
      <CreatorHero
        profile={profile}
        leadingAction={
          <WorkBackControl testID="author-back" onPress={onBack} />
        }
        actions={<AuthorShare sharePath={profile.sharePath} />}
      />
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
